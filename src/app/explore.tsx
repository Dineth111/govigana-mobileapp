import React from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Linking, 
  Platform,
  SafeAreaView,
  useColorScheme,
  Pressable
} from 'react-native';
import { Card, Button, List, IconButton, Appbar } from 'react-native-paper';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';

export default function ServicesScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(err => 
      console.error("Failed to make a call:", err)
    );
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(err => 
      console.error("Failed to open web link:", err)
    );
  };

  const cardStyle = [styles.card, { backgroundColor: scheme === 'dark' ? '#212225' : '#ffffff' }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content 
          title={
            <Pressable onPress={() => router.replace('/')}>
              <Text style={styles.appbarTitle}>Agricultural Resources 🚜</Text>
            </Pressable>
          } 
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mobitel 6666 Service Card */}
        <Card style={cardStyle}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.iconBig}>📞</Text>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Mobitel 6666 Agri Service</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                  Dial the official shortcode **6666** from any Mobitel connection to check daily wholesale prices for commodities and markets across Sri Lanka in Sinhala or Tamil.
                </Text>
              </View>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button 
              icon="phone-forward" 
              mode="contained" 
              buttonColor="#2E7D32" 
              textColor="#ffffff"
              onPress={() => handleCall('6666')}
            >
              Call Hotline (6666)
            </Button>
          </Card.Actions>
        </Card>

        {/* Official Helpdesks Card */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Official Departments</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Reach out directly to government institutes for agrarian research, datasets, or statistics queries.
            </Text>
            
            <DividerLine />

            {/* HARTI Helpdesk */}
            <View style={styles.subItem}>
              <View style={styles.subItemInfo}>
                <Text style={[styles.subItemTitle, { color: colors.text }]}>HARTI Institute</Text>
                <Text style={[styles.subItemDesc, { color: colors.textSecondary }]}>Hector Kobbekaduwa Agrarian Research and Training Institute</Text>
              </View>
              <IconButton 
                icon="phone" 
                iconColor="#2E7D32" 
                size={24} 
                onPress={() => handleCall('+94112696981')} 
              />
            </View>

            <DividerLine />

            {/* DCS Helpdesk */}
            <View style={styles.subItem}>
              <View style={styles.subItemInfo}>
                <Text style={[styles.subItemTitle, { color: colors.text }]}>DCS Department</Text>
                <Text style={[styles.subItemDesc, { color: colors.textSecondary }]}>Department of Census and Statistics (Colombo Office)</Text>
              </View>
              <IconButton 
                icon="phone" 
                iconColor="#2E7D32" 
                size={24} 
                onPress={() => handleCall('+94112147000')} 
              />
            </View>
          </Card.Content>
        </Card>

        {/* Quick Links Card */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Useful Portals & Websites</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Visit official sites to read detailed bulletins, seasonal weather analysis, or export reports.
            </Text>
            
            <View style={styles.buttonGrid}>
              <Button 
                mode="outlined" 
                style={styles.gridButton} 
                textColor="#2E7D32"
                onPress={() => handleOpenUrl('https://www.harti.gov.lk')}
              >
                HARTI Website
              </Button>
              <Button 
                mode="outlined" 
                style={styles.gridButton} 
                textColor="#2E7D32"
                onPress={() => handleOpenUrl('https://www.statistics.gov.lk')}
              >
                DCS Portal
              </Button>
            </View>
            <Button 
              mode="outlined" 
              style={styles.fullWidthButton} 
              textColor="#2E7D32"
              onPress={() => handleOpenUrl('https://www.doa.gov.lk')}
            >
              Department of Agriculture (DOA)
            </Button>
          </Card.Content>
        </Card>

        {/* Agricultural Best Practices */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Farmer Tips & Best Practices</Text>
            
            <List.Accordion
              title="Post-Harvest Handling"
              left={props => <List.Icon {...props} icon="leaf" color="#2E7D32" />}
              titleStyle={[styles.accordionTitle, { color: colors.text }]}
              style={{ backgroundColor: scheme === 'dark' ? '#212225' : '#ffffff' }}
              theme={{ colors: { primary: '#2E7D32' } }}
            >
              <Text style={[styles.accordionContent, { color: colors.textSecondary }]}>
                Keep crops under shade immediately after harvesting. Proper packaging (using plastic crates instead of gunny bags) can reduce transport damage by up to 25% for vegetables like tomatoes and beans.
              </Text>
            </List.Accordion>

            <List.Accordion
              title="Market Pricing Strategy"
              left={props => <List.Icon {...props} icon="trending-up" color="#2E7D32" />}
              titleStyle={[styles.accordionTitle, { color: colors.text }]}
              style={{ backgroundColor: scheme === 'dark' ? '#212225' : '#ffffff' }}
              theme={{ colors: { primary: '#2E7D32' } }}
            >
              <Text style={[styles.accordionContent, { color: colors.textSecondary }]}>
                Compare prices between Colombo and Dambulla economic centers using GoviGana before loading transport. Wholesale prices fluctuate daily depending on overnight arrivals.
              </Text>
            </List.Accordion>

            <List.Accordion
              title="Organic Composting"
              left={props => <List.Icon {...props} icon="sprout" color="#2E7D32" />}
              titleStyle={[styles.accordionTitle, { color: colors.text }]}
              style={{ backgroundColor: scheme === 'dark' ? '#212225' : '#ffffff' }}
              theme={{ colors: { primary: '#2E7D32' } }}
            >
              <Text style={[styles.accordionContent, { color: colors.textSecondary }]}>
                Mix green leaf wastes (nitrogen) with brown dry straws (carbon) in a 1:3 ratio. Keep the compost moist and turn it weekly to enhance decomposition and soil fertility.
              </Text>
            </List.Accordion>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// Simple Divider Line Component
const DividerLine = () => {
  const scheme = useColorScheme();
  return (
    <View style={[styles.divider, { backgroundColor: scheme === 'dark' ? '#2E3135' : '#eeeeee' }]} />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  appbar: {
    backgroundColor: '#2E7D32',
  },
  appbarTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 100 : 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBig: {
    fontSize: 36,
    marginRight: 16,
    marginTop: 4,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 12,
  },
  subItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subItemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  subItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  subItemDesc: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  gridButton: {
    flex: 1,
    borderColor: '#2E7D32',
    borderWidth: 1.5,
  },
  fullWidthButton: {
    marginTop: 12,
    borderColor: '#2E7D32',
    borderWidth: 1.5,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  accordionContent: {
    fontSize: 14,
    color: '#616161',
    paddingLeft: 56,
    paddingRight: 16,
    paddingBottom: 16,
    lineHeight: 20,
  },
});
