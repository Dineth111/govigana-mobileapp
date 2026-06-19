import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { 
  Appbar, 
  Searchbar, 
  SegmentedButtons, 
  Card, 
  Menu, 
  Button, 
  Divider, 
  Banner 
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import DetailModal from '../components/DetailModal';

const CACHE_KEY = 'govigana_prices_cache';

// Mapping crop Sinhala names to standard emojis
const EMOJI_MAP: { [key: string]: string } = {
  "බෝංචි": "🫛",
  "කැරට්": "🥕",
  "ලීක්ස්": "🥬",
  "බීට්": "🍠",
  "බීට් (නුවරඑළිය)": "🍠",
  "නෝකෝල්": "🥬",
  "රාබු": "🥕",
  "ගෝවා (නුවරඑළිය)": "🥬",
  "ගෝවා (මහනුවර)": "🥬",
  "ගෝවා": "🥬",
  "තක්කාලි": "🍅",
  "බණ්ඩක්කා": "🥒",
  "වම්බටු": "🍆",
  "වම්බටු (Eggplant)": "🍆",
  "මාළු මිරිස්": "🫑",
  "වට්ටක්කා": "🎃",
  "පිපිඤ්ඤා": "🥒",
  "කරවිල": "🥒",
  "පතෝල": "🥒",
  "වැටකොළු": "🥒",
  "මුරුංගා": "🥢",
  "මා කරල්": "🫛",
  "අළු කෙසෙල්": "🍌",
  "අමු මිරිස්": "🌶️",
  "දෙහි": "🍋",
  "බතල": "🍠",
  "මඤ්ඤොක්කා": "🍠",
  "අල (රට)": "🥔",
  "අල (වැලිමඩ)": "🥔",
  "අල (නුවරඑළිය)": "🥔",
  "ලොකු ලූණු (රට)": "🧅",
  "ලොකු ලූණු (දේශීය)": "🧅",
  "ඇඹුල් කෙසෙල්": "🍌",
  "කෝලිකුට්ටු කෙසෙල්": "🍌",
  "සීනි කෙසෙල්": "🍌",
  "ආනමාලු කෙසෙල්": "🍌",
  "පැපොල්": "🍈",
  "පැෂන් පෘට්": "🍇",
  "අන්නාසි (ලොකු)": "🍍",
  "අන්නාසි (මැද)": "🍍",
  "අන්නාසි (පොඩි)": "🍍",
  "අඹ (බෙට්ටි)": "🥭",
  "අඹ (කර්තකොලොම්බන්)": "🥭",
  "දිවුල්": "🥥",
  "අලිගැටපේර": "🥑",
  "දොඩම්": "🍊"
};

function getCropEmoji(cropName: string): string {
  // Try exact lookup
  if (EMOJI_MAP[cropName]) return EMOJI_MAP[cropName];
  
  // Try substring lookup
  for (const key in EMOJI_MAP) {
    if (cropName.includes(key) || key.includes(cropName)) {
      return EMOJI_MAP[key];
    }
  }
  return "🌱"; // Default fallback
}

interface PriceItem {
  id: string;
  market: string;
  category: string;
  crop: string;
  price: number;
  unit: string;
  date: string;
  change: number | null;
  source: string;
}

export default function HomeScreen() {
  // State
  const [market, setMarket] = useState<string>('Colombo');
  const [category, setCategory] = useState<string>('all'); // 'all', 'එළවළු', 'පලතුරු'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('Never');
  const [isStaleData, setIsStaleData] = useState<boolean>(false);
  
  // Menu visibility
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  
  // Detail Modal state
  const [selectedCrop, setSelectedCrop] = useState<PriceItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    loadCachedData();
  }, []);

  useEffect(() => {
    fetchPrices(market);
  }, [market]);

  // Load cached offline prices from AsyncStorage
  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${market}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setPrices(parsed.data || []);
        if (parsed.timestamp) {
          const cacheDate = new Date(parsed.timestamp);
          setLastUpdatedText(cacheDate.toLocaleDateString() + ' ' + cacheDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          checkStaleness(parsed.timestamp);
        }
      }
    } catch (e) {
      console.error('Failed to load cache:', e);
    }
  };

  // Determine if retrieved data is older than 24 hours
  const checkStaleness = (timestamp: number) => {
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const diff = Date.now() - timestamp;
    setIsStaleData(diff > oneDayInMs);
  };

  // Fetch prices for selected market
  const fetchPrices = async (targetMarket: string, isRefreshed: boolean = false) => {
    if (isRefreshed) setRefreshing(true);
    else setLoading(true);
    
    setOfflineMode(false);
    
    try {
      // 1. Find the latest available date for this market
      const { data: dateData, error: dateError } = await supabase
        .from('prices')
        .select('date')
        .eq('market', targetMarket)
        .order('date', { ascending: false })
        .limit(1);

      if (dateError) throw dateError;

      if (!dateData || dateData.length === 0) {
        setPrices([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const latestDate = dateData[0].date;

      // 2. Fetch all prices for that specific date and market
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select('*')
        .eq('market', targetMarket)
        .eq('date', latestDate)
        .order('crop', { ascending: true });

      if (pricesError) throw pricesError;

      if (pricesData) {
        setPrices(pricesData);
        
        // Write to cache
        const cachePayload = {
          timestamp: Date.now(),
          data: pricesData
        };
        await AsyncStorage.setItem(`${CACHE_KEY}_${targetMarket}`, JSON.stringify(cachePayload));
        
        const now = new Date();
        setLastUpdatedText(now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setIsStaleData(false);
      }
    } catch (error: any) {
      console.error('Fetch prices error:', error.message);
      setOfflineMode(true);
      // Try to load cached data for this market as fallback
      await loadCachedData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchPrices(market, true);
  };

  // Filtering crop items
  const filteredPrices = prices.filter(item => {
    // 1. Category check
    const matchesCategory = category === 'all' || item.category === category;
    
    // 2. Search check
    const matchesSearch = item.crop.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const selectCrop = (crop: PriceItem) => {
    setSelectedCrop(crop);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Appbar Header */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="GoviGana 🌾" titleStyle={styles.appbarTitle} />
        
        {/* Market Selector Dropdown */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button 
              mode="elevated" 
              onPress={() => setMenuVisible(true)}
              textColor="#ffffff"
              buttonColor="#1b5e20"
              style={styles.marketButton}
              labelStyle={styles.marketButtonLabel}
              icon="chevron-down"
            >
              {market}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setMarket('Colombo'); setMenuVisible(false); }} title="Colombo" />
          <Divider />
          <Menu.Item onPress={() => { setMarket('Dambulla'); setMenuVisible(false); }} title="Dambulla" />
          <Divider />
          <Menu.Item onPress={() => { setMarket('Narahenpita'); setMenuVisible(false); }} title="Narahenpita" />
          <Divider />
          <Menu.Item onPress={() => { setMarket('Mannar'); setMenuVisible(false); }} title="Mannar" />
        </Menu>
      </Appbar.Header>

      {/* Offline Mode Banner */}
      <Banner
        visible={offlineMode}
        actions={[{ label: 'Retry Connection', onPress: handleRefresh }]}
        icon="wifi-off"
        style={styles.offlineBanner}
      >
        No internet connection. Showing offline cached prices.
      </Banner>

      {/* Last Updated Indicator */}
      <View style={[
        styles.updatedIndicator, 
        isStaleData ? styles.staleIndicator : styles.freshIndicator
      ]}>
        <Text style={[styles.updatedText, isStaleData && styles.staleText]}>
          📅 Data Date: {prices[0]?.date || 'N/A'} {isStaleData ? '(Older than 1 day - Fallback Active)' : ''}
        </Text>
      </View>

      {/* Search Input */}
      <Searchbar
        placeholder="සොයන්න / Search Crop..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        placeholderTextColor="#9e9e9e"
      />

      {/* Category Tabs */}
      <SegmentedButtons
        value={category}
        onValueChange={setCategory}
        style={styles.segmentedButtons}
        theme={{ colors: { primary: '#2E7D32' } }}
        buttons={[
          { value: 'all', label: 'සියල්ල (All)' },
          { value: 'එළවළු', label: 'එළවළු (Veg)' },
          { value: 'පලතුරු', label: 'පලතුරු (Fruit)' },
        ]}
      />

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Fetching daily prices...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPrices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            // Price Change styling
            let changeColor = '#757575'; // Grey
            let changeIndicator = '•';
            if (item.change !== null) {
              if (item.change > 0) {
                changeColor = '#2E7D32'; // Green
                changeIndicator = '↑';
              } else if (item.change < 0) {
                changeColor = '#C62828'; // Red
                changeIndicator = '↓';
              }
            }

            return (
              <Card style={styles.card} onPress={() => selectCrop(item)}>
                <Card.Content style={styles.cardContent}>
                  
                  {/* Left Column: Emoji + Name */}
                  <View style={styles.leftCol}>
                    <Text style={styles.emoji}>{getCropEmoji(item.crop)}</Text>
                    <View style={styles.nameContainer}>
                      <Text style={styles.cropName}>{item.crop}</Text>
                      <Text style={styles.sourceLabel}>Source: {item.source}</Text>
                    </View>
                  </View>

                  {/* Right Column: Price + Change */}
                  <View style={styles.rightCol}>
                    <Text style={styles.priceText}>
                      Rs. {item.price}
                    </Text>
                    <Text style={styles.unitLabel}>per {item.unit}</Text>
                    
                    {item.change !== null && (
                      <View style={[styles.changeBadge, { backgroundColor: changeColor + '15' }]}>
                        <Text style={[styles.changeText, { color: changeColor }]}>
                          {changeIndicator} {Math.abs(item.change)} LKR
                        </Text>
                      </View>
                    )}
                  </View>

                </Card.Content>
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No price data available.</Text>
              <Text style={styles.emptySub}>Try shifting filters or pulling to refresh.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2E7D32']}
              tintColor="#2E7D32"
            />
          }
        />
      )}

      {/* Detail Modal */}
      {selectedCrop && (
        <DetailModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          cropName={selectedCrop.crop}
          market={selectedCrop.market}
          currentPrice={selectedCrop.price}
          unit={selectedCrop.unit}
          change={selectedCrop.change}
          source={selectedCrop.source}
          date={selectedCrop.date}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  appbar: {
    backgroundColor: '#2E7D32',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  appbarTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 22,
  },
  marketButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#388e3c',
  },
  marketButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: '#ffebee',
  },
  updatedIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  freshIndicator: {
    backgroundColor: '#e8f5e9',
  },
  staleIndicator: {
    backgroundColor: '#fff8e1', // Amber warning background
  },
  updatedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2e7d32',
  },
  staleText: {
    color: '#b7791f', // Amber warning text
  },
  searchBar: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
    fontSize: 15,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1.5,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 34,
    marginRight: 14,
  },
  nameContainer: {
    flex: 1,
  },
  cropName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#212121',
  },
  sourceLabel: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 4,
    fontWeight: '600',
  },
  rightCol: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2e7d32',
  },
  unitLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
    fontWeight: '500',
  },
  changeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#757575',
  },
  emptySub: {
    fontSize: 13,
    color: '#9e9e9e',
    marginTop: 4,
  },
});
