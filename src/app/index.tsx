import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl, 
  SafeAreaView, 
  Platform,
  Pressable,
  ScrollView,
  useColorScheme
} from 'react-native';
import { 
  Appbar, 
  Searchbar, 
  SegmentedButtons, 
  Card, 
  Button, 
  Divider, 
  Banner,
  Chip,
  List
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import DetailModal from '../components/DetailModal';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';

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

const TRANSLATION_MAP: { [key: string]: string[] } = {
  "beans": ["බෝංචි", "මා කරල්"],
  "carrot": ["කැරට්"],
  "leeks": ["ලීක්ස්"],
  "beet": ["බීට්", "බීට් (නුවරඑළිය)"],
  "knolkhol": ["නෝකෝල්"],
  "radish": ["රාබු"],
  "cabbage": ["ගෝවා", "ගෝවා (නුවරඑළිය)", "ගෝවා (මහනුවර)"],
  "tomato": ["තක්කාලි"],
  "okra": ["බණ්ඩක්කා", "ladies finger"],
  "brinjal": ["වම්බටු", "වම්බටු (Eggplant)", "eggplant"],
  "capsicum": ["මාළු මිරිස්"],
  "pumpkin": ["වට්ටක්කා"],
  "cucumber": ["පිපිඤ්ඤා"],
  "bitter gourd": ["කරවිල"],
  "snake gourd": ["පතෝල"],
  "luffa": ["වැටකොළු", "ridge gourd"],
  "drumstick": ["මුරුංගා"],
  "ash plantain": ["අළු කෙසෙල්"],
  "green chilli": ["අමු මිරිස්"],
  "lime": ["දෙහි"],
  "sweet potato": ["බතල"],
  "manioc": ["මඤ්ඤොක්කා", "cassava"],
  "potato": ["අල (රට)", "අල (වැලිමඩ)", "අල (නුවරඑළිය)", "අල"],
  "big onion": ["ලොකු ලූණු (රට)", "ලොකු ලූණු (දේශීය)", "ලූණු"],
  "banana": ["ඇඹුල් කෙසෙල්", "කෝලිකුට්ටු කෙසෙල්", "සීනි කෙසෙල්", "ආනමාලු කෙසෙල්", "කෙසෙල්"],
  "papaya": ["පැපොල්"],
  "passion fruit": ["පැෂන් පෘට්"],
  "pineapple": ["අන්නාසි (ලොකු)", "අන්නාසි (මැද)", "අන්නාසි (පොඩි)", "අන්නාසි"],
  "mango": ["අඹ (බෙට්ටි)", "අඹ (කර්තකොලොම්බන්)", "අඹ"],
  "wood apple": ["දිවුල්"],
  "avocado": ["අලිගැටපේර"],
  "orange": ["දොඩම්"]
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
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

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
  const [sortBy, setSortBy] = useState<'alpha' | 'price_asc' | 'price_desc' | 'change_desc'>('alpha');
  
  // Detail Modal state
  const [selectedCrop, setSelectedCrop] = useState<PriceItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    loadCachedData();
  }, []);

  useEffect(() => {
    fetchPrices(market);
  }, [market]);

  // Helper to determine if pricing date is older than 1 calendar day compared to today
  const checkDataStaleness = (dataDateStr: string | undefined) => {
    if (!dataDateStr) return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dataDate = new Date(dataDateStr);
      dataDate.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - dataDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      // If data is older than 1 calendar day, flag it as stale
      return diffDays > 1;
    } catch (e) {
      console.error('Error checking staleness:', e);
      return false;
    }
  };

  // Load cached offline prices from AsyncStorage
  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${market}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const parsedData = parsed.data || [];
        setPrices(parsedData);
        if (parsed.timestamp) {
          const cacheDate = new Date(parsed.timestamp);
          setLastUpdatedText(cacheDate.toLocaleDateString() + ' ' + cacheDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        if (parsedData.length > 0) {
          setIsStaleData(checkDataStaleness(parsedData[0].date));
        }
      }
    } catch (e) {
      console.error('Failed to load cache:', e);
    }
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
        setIsStaleData(checkDataStaleness(latestDate));
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
    
    // 2. Search check (Sinhala name or English translation match)
    const normalizedQuery = searchQuery.toLowerCase().trim();
    if (!normalizedQuery) return matchesCategory;

    const matchesSinhala = item.crop.toLowerCase().includes(normalizedQuery);
    
    // Check English translations
    let matchesEnglish = false;
    for (const [englishWord, sinhalaList] of Object.entries(TRANSLATION_MAP)) {
      if (englishWord.includes(normalizedQuery)) {
        if (sinhalaList.some(sinhalaName => item.crop.includes(sinhalaName) || sinhalaName.includes(item.crop))) {
          matchesEnglish = true;
          break;
        }
      }
    }

    return matchesCategory && (matchesSinhala || matchesEnglish);
  });

  const sortedPrices = [...filteredPrices].sort((a, b) => {
    if (sortBy === 'alpha') {
      return a.crop.localeCompare(b.crop);
    } else if (sortBy === 'price_asc') {
      return a.price - b.price;
    } else if (sortBy === 'price_desc') {
      return b.price - a.price;
    } else if (sortBy === 'change_desc') {
      const changeA = a.change || 0;
      const changeB = b.change || 0;
      return changeB - changeA;
    }
    return 0;
  });

  const selectCrop = (crop: PriceItem) => {
    setSelectedCrop(crop);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Appbar Header */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content 
          title={
            <Pressable onPress={() => router.replace('/')}>
              <Text style={styles.appbarTitle}>GoviGana 🌾</Text>
            </Pressable>
          } 
        />
        
        {/* Market Selector Dropdown Button */}
        <Button 
          mode="elevated" 
          onPress={() => setMenuVisible(!menuVisible)}
          textColor="#ffffff"
          buttonColor="#1b5e20"
          style={styles.marketButton}
          labelStyle={styles.marketButtonLabel}
          icon="chevron-down"
        >
          {market}
        </Button>
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
        isStaleData 
          ? [styles.staleIndicator, scheme === 'dark' && { backgroundColor: '#3e2723' }] 
          : [styles.freshIndicator, scheme === 'dark' && { backgroundColor: '#1b5e20' }]
      ]}>
        <Text style={[
          styles.updatedText, 
          scheme === 'dark' && { color: '#ffffff' },
          isStaleData && [styles.staleText, scheme === 'dark' && { color: '#ffb74d' }]
        ]}>
          📅 Data Date: {prices[0]?.date || 'N/A'} {isStaleData ? '⚠️ (Stale - No newer government reports published yet)' : '✓ (Latest)'}
        </Text>
      </View>

      {/* Search Input */}
      <Searchbar
        placeholder="සොයන්න / Search Crop..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[
          styles.searchBar, 
          { backgroundColor: scheme === 'dark' ? '#212225' : '#ffffff' }
        ]}
        inputStyle={[
          styles.searchInput,
          { color: colors.text }
        ]}
        iconColor="#2E7D32"
        placeholderTextColor={scheme === 'dark' ? '#B0B4BA' : '#9e9e9e'}
      />

      {/* Sort Options Horizontal Chips */}
      <View style={styles.sortChipsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.sortChipsContainer}
        >
          <Chip 
            selected={sortBy === 'alpha'} 
            onPress={() => setSortBy('alpha')}
            style={[
              styles.sortChip, 
              { backgroundColor: scheme === 'dark' ? '#212225' : '#f0f0f3', borderColor: scheme === 'dark' ? '#333' : '#e0e0e0' },
              sortBy === 'alpha' && styles.selectedSortChip
            ]}
            textStyle={[
              styles.sortChipText, 
              { color: scheme === 'dark' ? '#B0B4BA' : '#60646c' },
              sortBy === 'alpha' && styles.selectedSortChipText
            ]}
            showSelectedOverlay={Platform.OS !== 'web'}
            showSelectedCheck={false}
          >
            Name
          </Chip>
          <Chip 
            selected={sortBy === 'price_asc'} 
            onPress={() => setSortBy('price_asc')}
            style={[
              styles.sortChip, 
              { backgroundColor: scheme === 'dark' ? '#212225' : '#f0f0f3', borderColor: scheme === 'dark' ? '#333' : '#e0e0e0' },
              sortBy === 'price_asc' && styles.selectedSortChip
            ]}
            textStyle={[
              styles.sortChipText, 
              { color: scheme === 'dark' ? '#B0B4BA' : '#60646c' },
              sortBy === 'price_asc' && styles.selectedSortChipText
            ]}
            showSelectedOverlay={Platform.OS !== 'web'}
            showSelectedCheck={false}
          >
            Price: Low-High
          </Chip>
          <Chip 
            selected={sortBy === 'price_desc'} 
            onPress={() => setSortBy('price_desc')}
            style={[
              styles.sortChip, 
              { backgroundColor: scheme === 'dark' ? '#212225' : '#f0f0f3', borderColor: scheme === 'dark' ? '#333' : '#e0e0e0' },
              sortBy === 'price_desc' && styles.selectedSortChip
            ]}
            textStyle={[
              styles.sortChipText, 
              { color: scheme === 'dark' ? '#B0B4BA' : '#60646c' },
              sortBy === 'price_desc' && styles.selectedSortChipText
            ]}
            showSelectedOverlay={Platform.OS !== 'web'}
            showSelectedCheck={false}
          >
            Price: High-Low
          </Chip>
          <Chip 
            selected={sortBy === 'change_desc'} 
            onPress={() => setSortBy('change_desc')}
            style={[
              styles.sortChip, 
              { backgroundColor: scheme === 'dark' ? '#212225' : '#f0f0f3', borderColor: scheme === 'dark' ? '#333' : '#e0e0e0' },
              sortBy === 'change_desc' && styles.selectedSortChip
            ]}
            textStyle={[
              styles.sortChipText, 
              { color: scheme === 'dark' ? '#B0B4BA' : '#60646c' },
              sortBy === 'change_desc' && styles.selectedSortChipText
            ]}
            showSelectedOverlay={Platform.OS !== 'web'}
            showSelectedCheck={false}
          >
            High Increase First
          </Chip>
        </ScrollView>
      </View>

      {/* Category Tabs */}
      <SegmentedButtons
        value={category}
        onValueChange={setCategory}
        style={styles.segmentedButtons}
        theme={{ 
          colors: { 
            secondaryContainer: scheme === 'dark' ? '#2E7D32' : '#E8F5E9', 
            onSecondaryContainer: scheme === 'dark' ? '#ffffff' : '#2E7D32',
            outline: '#2E7D32',
            primary: '#2E7D32',
            onSurface: scheme === 'dark' ? '#ffffff' : '#212121',
            onSurfaceVariant: scheme === 'dark' ? '#B0B4BA' : '#555555'
          } 
        }}
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
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Fetching daily prices...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedPrices}
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
              <Card 
                style={[styles.card, { backgroundColor: scheme === 'dark' ? '#212225' : '#ffffff' }]} 
                onPress={() => selectCrop(item)}
              >
                <Card.Content style={styles.cardContent}>
                  
                  {/* Left Column: Emoji + Name */}
                  <View style={styles.leftCol}>
                    <Text style={styles.emoji}>{getCropEmoji(item.crop)}</Text>
                    <View style={styles.nameContainer}>
                      <Text style={[styles.cropName, { color: colors.text }]}>{item.crop}</Text>
                      <Text style={[styles.sourceLabel, { color: colors.textSecondary }]}>Source: {item.source}</Text>
                    </View>
                  </View>

                  {/* Right Column: Price + Change */}
                  <View style={styles.rightCol}>
                    <Text style={styles.priceText}>
                      Rs. {item.price}
                    </Text>
                    <Text style={[styles.unitLabel, { color: colors.textSecondary }]}>per {item.unit}</Text>
                    
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
              <Text style={[styles.emptyText, { color: colors.text }]}>No price data available.</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try shifting filters or pulling to refresh.</Text>
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

      {/* Custom Dropdown Overlay (Fixes Web Portal anchor issue and DOM stacking context) */}
      {menuVisible && (
        <View style={styles.dropdownOverlay}>
          <Pressable style={styles.dropdownBackdrop} onPress={() => setMenuVisible(false)} />
          <Card style={[styles.dropdownCard, { backgroundColor: colors.backgroundElement }]}>
            <List.Item 
              title="Colombo" 
              onPress={() => { setMarket('Colombo'); setMenuVisible(false); }} 
              style={market === 'Colombo' ? [styles.dropdownSelected, { backgroundColor: scheme === 'dark' ? '#2E7D32' : '#E8F5E9' }] : null}
              titleStyle={[styles.dropdownText, { color: colors.text }]}
            />
            <Divider style={[styles.dropdownDivider, { backgroundColor: scheme === 'dark' ? '#2E3135' : '#f1f1f1' }]} />
            <List.Item 
              title="Dambulla" 
              onPress={() => { setMarket('Dambulla'); setMenuVisible(false); }} 
              style={market === 'Dambulla' ? [styles.dropdownSelected, { backgroundColor: scheme === 'dark' ? '#2E7D32' : '#E8F5E9' }] : null}
              titleStyle={[styles.dropdownText, { color: colors.text }]}
            />
          </Card>
        </View>
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
    paddingBottom: Platform.OS === 'web' ? 100 : 24,
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
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  dropdownCard: {
    position: 'absolute',
    top: Platform.select({
      android: 80,
      ios: 56,
      default: 56,
    }),
    right: 12,
    width: 180,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1001,
    overflow: 'hidden',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownSelected: {
  },
  dropdownDivider: {
  },
  sortChipsWrapper: {
    marginBottom: 12,
  },
  sortChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortChip: {
    backgroundColor: '#f0f0f3',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 20,
    height: 36,
  },
  selectedSortChip: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  sortChipText: {
    color: '#60646c',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedSortChipText: {
    color: '#ffffff',
  },
});
