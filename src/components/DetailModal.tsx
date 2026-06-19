import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Share,
  useColorScheme
} from 'react-native';
import { Card, Button, IconButton, MD3Colors } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../utils/supabase';
import { Colors } from '../constants/theme';

interface DetailModalProps {
  visible: boolean;
  onClose: () => void;
  cropName: string;
  market: string;
  currentPrice: number;
  unit: string;
  change: number | null;
  source: string;
  date: string;
}

interface PriceHistoryPoint {
  price: number;
  date: string;
}

export default function DetailModal({
  visible,
  onClose,
  cropName,
  market,
  currentPrice,
  unit,
  change,
  source,
  date,
}: DetailModalProps) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible && cropName && market) {
      fetchPriceHistory();
    }
  }, [visible, cropName, market]);

  const fetchPriceHistory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch last 7 records ordered by date ascending
      const { data, error } = await supabase
        .from('prices')
        .select('price, date')
        .eq('market', market)
        .eq('crop', cropName)
        .order('date', { ascending: true })
        .limit(7);

      if (error) {
        throw error;
      }

      if (data) {
        // Map and parse the results
        const mappedData = data.map((item: any) => ({
          price: item.price,
          date: item.date,
        }));
        setHistory(mappedData);
      }
    } catch (error: any) {
      console.error('Error fetching history:', error.message);
      setErrorMsg('Could not load price chart.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    let changeText = 'No Change';
    if (change !== null) {
      if (change > 0) changeText = `LKR +${change} ↑`;
      else if (change < 0) changeText = `LKR ${change} ↓`;
    }

    const shareMessage = `GoviGana Price Alert! 🌾\n\n` +
      `Crop: ${cropName}\n` +
      `Market: ${market}\n` +
      `Price: LKR ${currentPrice} per ${unit}\n` +
      `Change: ${changeText}\n` +
      `Source: ${source}\n` +
      `Date: ${date}\n\n` +
      `Download GoviGana to track daily agricultural wholesale prices in Sri Lanka.`;

    try {
      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Prepare chart data
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 48; // padding

  const hasChartData = history && history.length >= 2;

  // Format dates for labels (e.g. '06-15')
  const chartLabels = history.map(item => {
    const parts = item.date.split('-');
    return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : item.date;
  });

  const chartPrices = history.map(item => item.price);

  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartPrices,
        color: (opacity = 1) => scheme === 'dark' ? `rgba(129, 199, 132, ${opacity})` : `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 3
      }
    ]
  };

  // Change indicator styling
  let changeColor = '#757575'; // Grey
  let changeSign = '';
  if (change !== null) {
    if (change > 0) {
      changeColor = '#2E7D32'; // Green
      changeSign = '+';
    } else if (change < 0) {
      changeColor = '#C62828'; // Red
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: scheme === 'dark' ? '#212225' : '#ffffff' }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.cropTitle, { color: scheme === 'dark' ? '#81c784' : '#1b5e20' }]}>{cropName}</Text>
              <Text style={[styles.marketSub, { color: colors.textSecondary }]}>{market} Wholesale Market</Text>
            </View>
            <IconButton 
              icon="close" 
              size={28} 
              iconColor={scheme === 'dark' ? '#81c784' : '#2E7D32'} 
              onPress={onClose} 
            />
          </View>

          {/* Pricing Info Card */}
          <Card style={[styles.priceCard, { backgroundColor: scheme === 'dark' ? '#1b5e2030' : '#f1f8e9' }]}>
            <Card.Content style={styles.priceCardContent}>
              <View>
                <Text style={[styles.priceLabel, { color: scheme === 'dark' ? '#81c784' : '#558b2f' }]}>Current Price</Text>
                <Text style={[styles.priceValue, { color: scheme === 'dark' ? '#ffffff' : '#2e7d32' }]}>
                  LKR {currentPrice} <Text style={[styles.unitText, { color: scheme === 'dark' ? '#81c784' : '#558b2f' }]}>/ {unit}</Text>
                </Text>
              </View>
              {change !== null && (
                <View style={[styles.changeBadge, { backgroundColor: changeColor + '20' }]}>
                  <Text style={[styles.changeText, { color: changeColor }]}>
                    {changeSign}{change} LKR {change > 0 ? '↑' : change < 0 ? '↓' : ''}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Chart Section */}
          <View style={styles.chartSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>7-Day Price History</Text>
            {loading ? (
              <View style={[styles.chartPlaceholder, { backgroundColor: scheme === 'dark' ? '#161618' : '#f5f5f5' }]}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Fetching history chart...</Text>
              </View>
            ) : errorMsg ? (
              <View style={[styles.chartPlaceholder, { backgroundColor: scheme === 'dark' ? '#161618' : '#f5f5f5' }]}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : !hasChartData ? (
              <View style={[styles.chartPlaceholder, { backgroundColor: scheme === 'dark' ? '#161618' : '#f5f5f5' }]}>
                <Text style={[styles.noDataText, { color: colors.textSecondary }]}>Not enough historical data to display trend chart.</Text>
              </View>
            ) : (
              <LineChart
                data={chartData}
                width={chartWidth}
                height={200}
                chartConfig={{
                  backgroundColor: scheme === 'dark' ? '#212225' : '#ffffff',
                  backgroundGradientFrom: scheme === 'dark' ? '#212225' : '#ffffff',
                  backgroundGradientTo: scheme === 'dark' ? '#212225' : '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => scheme === 'dark' ? `rgba(129, 199, 132, ${opacity})` : `rgba(46, 125, 50, ${opacity})`,
                  labelColor: (opacity = 1) => scheme === 'dark' ? `rgba(176, 180, 186, ${opacity})` : `rgba(117, 117, 117, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: scheme === 'dark' ? '#81c784' : '#2E7D32'
                  }
                }}
                bezier
                style={styles.chartStyle}
              />
            )}
          </View>

          {/* Footer Details */}
          <View style={styles.footer}>
            <Text style={[styles.sourceText, { color: colors.textSecondary }]}>Source: {source}</Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>As of: {date}</Text>
          </View>

          {/* Share Button */}
          <Button 
            mode="contained" 
            icon="share-variant"
            buttonColor="#2E7D32"
            textColor="#ffffff"
            style={styles.shareButton}
            labelStyle={styles.shareButtonLabel}
            onPress={handleShare}
          >
            Share Price Alert
          </Button>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    minHeight: '65%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flex: 1,
  },
  cropTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1b5e20',
  },
  marketSub: {
    fontSize: 16,
    color: '#757575',
    marginTop: 2,
    fontWeight: '500',
  },
  priceCard: {
    backgroundColor: '#f1f8e9',
    borderRadius: 16,
    marginBottom: 24,
    elevation: 1,
  },
  priceCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#558b2f',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
    marginTop: 4,
  },
  unitText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#558b2f',
  },
  changeBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
    fontSize: 14,
  },
  noDataText: {
    color: '#757575',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sourceText: {
    fontSize: 13,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 13,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  shareButton: {
    borderRadius: 12,
    paddingVertical: 6,
  },
  shareButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
