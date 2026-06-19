import React, { useEffect, useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Linking, 
  Platform,
  SafeAreaView,
  RefreshControl,
  useColorScheme,
  Pressable
} from 'react-native';
import { Card, Button, List, Appbar, ActivityIndicator, Divider } from 'react-native-paper';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';

interface ScraperRun {
  id: string;
  run_at: string;
  source_used: string;
  success: boolean;
  rows_written: number;
  error_message: string | null;
}

export default function AboutScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchScraperRuns = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('scraper_runs')
        .select('*')
        .order('run_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) {
        setRuns(data);
      }
    } catch (err: any) {
      console.error("Failed to fetch scraper runs:", err);
      setErrorMsg("Unable to retrieve sync history. Please check your internet connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScraperRuns();
  }, []);

  const handleOpenGithub = () => {
    Linking.openURL('https://github.com').catch(err => 
      console.error("Failed to open GitHub link:", err)
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const cardStyle = [styles.card, { backgroundColor: scheme === 'dark' ? '#212225' : '#ffffff' }];
  const dividerStyle = [styles.divider, { backgroundColor: scheme === 'dark' ? '#2E3135' : '#eeeeee' }];
  const miniDividerStyle = [styles.miniDivider, { backgroundColor: scheme === 'dark' ? '#2E3135' : '#f1f1f1' }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content 
          title={
            <Pressable onPress={() => router.replace('/')}>
              <Text style={styles.appbarTitle}>About GoviGana 🌾</Text>
            </Pressable>
          } 
        />
      </Appbar.Header>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => fetchScraperRuns(true)}
            colors={['#2E7D32']}
          />
        }
      >
        {/* Intro Card */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text style={styles.appTitle}>GoviGana / ගොවිගණ</Text>
            <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>Empowering Local Farmers through Open Pricing Data</Text>
            <Divider style={dividerStyle} />
            <Text style={[styles.descText, { color: colors.text }]}>
              GoviGana is a public-spirited, open-source, read-only agricultural wholesale price tracking mobile app for Sri Lanka. 
              By retrieving daily pricing reports directly from official government bulletins (such as the Hector Kobbekaduwa Agrarian Research and Training Institute - HARTI), 
              GoviGana provides up-to-date and transparent wholesale market pricing.
            </Text>
          </Card.Content>
        </Card>

        {/* Features / Mission Card */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Features</Text>
            
            <List.Item
              title="Data Transparency"
              description="Sourced directly from official HARTI daily bulletins with no manual markup."
              left={props => <List.Icon {...props} icon="eye-outline" color="#2E7D32" />}
              titleStyle={[styles.listItemTitle, { color: colors.text }]}
              descriptionStyle={[styles.listItemDesc, { color: colors.textSecondary }]}
            />
            <Divider style={miniDividerStyle} />
            
            <List.Item
              title="Offline-First Support"
              description="Prices are cached locally so farmers can access them even in remote fields without network."
              left={props => <List.Icon {...props} icon="wifi-off" color="#2E7D32" />}
              titleStyle={[styles.listItemTitle, { color: colors.text }]}
              descriptionStyle={[styles.listItemDesc, { color: colors.textSecondary }]}
            />
            <Divider style={miniDividerStyle} />
            
            <List.Item
              title="Free Public Good"
              description="No user registrations, no phone numbers required, and zero commercial advertising."
              left={props => <List.Icon {...props} icon="gift-outline" color="#2E7D32" />}
              titleStyle={[styles.listItemTitle, { color: colors.text }]}
              descriptionStyle={[styles.listItemDesc, { color: colors.textSecondary }]}
            />
          </Card.Content>
        </Card>

        {/* Database Sync Status Logs */}
        <Card style={cardStyle}>
          <Card.Content>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>System Sync Status</Text>
              {loading && !refreshing && <ActivityIndicator size="small" color="#2E7D32" />}
            </View>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              The GoviGana background scraper runs automatically on GitHub Actions at 8:30 AM SLT to fetch the latest bulletins.
            </Text>
            
            <Divider style={dividerStyle} />

            {errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : runs.length === 0 ? (
              !loading && <Text style={[styles.infoText, { color: colors.textSecondary }]}>No scraper run logs found.</Text>
            ) : (
              runs.map((run, idx) => (
                <View key={run.id || idx}>
                  <View style={styles.runItem}>
                    <View style={styles.runHeader}>
                      <Text style={[styles.statusIndicator, { color: run.success ? '#2E7D32' : '#D32F2F' }]}>
                        {run.success ? '● Success' : '● Failed'}
                      </Text>
                      <Text style={[styles.runDate, { color: colors.textSecondary }]}>{formatDate(run.run_at)}</Text>
                    </View>
                    <View style={styles.runDetails}>
                      <Text style={[styles.runText, { color: colors.textSecondary }]}>
                        Source: <Text style={[styles.boldText, { color: colors.text }]}>{run.source_used}</Text>
                      </Text>
                      <Text style={[styles.runText, { color: colors.textSecondary }]}>
                        Records Scraped: <Text style={[styles.boldText, { color: colors.text }]}>{run.rows_written}</Text>
                      </Text>
                    </View>
                    {!run.success && run.error_message && (
                      <Text style={styles.errorMessage}>Error: {run.error_message}</Text>
                    )}
                  </View>
                  {idx < runs.length - 1 && <Divider style={miniDividerStyle} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Meta / Developer Card */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Application Info</Text>
            
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Version</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>1.0.0 (MVP)</Text>
            </View>
            <Divider style={miniDividerStyle} />

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Framework</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>Expo SDK 56 & Supabase</Text>
            </View>
            <Divider style={miniDividerStyle} />

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Hosting</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>GitHub Actions & Supabase DB</Text>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button 
              icon="github" 
              mode="contained" 
              buttonColor="#2E7D32" 
              textColor="#ffffff"
              style={styles.actionBtn}
              onPress={handleOpenGithub}
            >
              View GitHub Source
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
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
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2E7D32',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '600',
    marginTop: 4,
  },
  descText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 22,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#757575',
    lineHeight: 18,
  },
  divider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: '#eeeeee',
  },
  miniDivider: {
    marginVertical: 8,
    height: 1,
    backgroundColor: '#f1f1f1',
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
  },
  listItemDesc: {
    fontSize: 13,
    color: '#666666',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runItem: {
    paddingVertical: 6,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIndicator: {
    fontSize: 13,
    fontWeight: '700',
  },
  runDate: {
    fontSize: 12,
    color: '#757575',
  },
  runDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  runText: {
    fontSize: 13,
    color: '#616161',
  },
  boldText: {
    fontWeight: '600',
    color: '#333333',
  },
  errorMessage: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
    paddingLeft: 12,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 13,
  },
  infoText: {
    textAlign: 'center',
    paddingVertical: 12,
    color: '#757575',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  actionBtn: {
    width: '100%',
    borderRadius: 8,
  },
});
