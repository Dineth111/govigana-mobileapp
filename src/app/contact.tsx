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
import { Card, Button, List, Appbar, Divider } from 'react-native-paper';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';

export default function ContactScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@govigana.lk').catch(err => 
      console.error("Failed to open mail app:", err)
    );
  };

  const handleCallPress = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(err => 
      console.error("Failed to make a call:", err)
    );
  };

  const handleGithubPress = () => {
    Linking.openURL('https://github.com').catch(err => 
      console.error("Failed to open GitHub link:", err)
    );
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
              <Text style={styles.appbarTitle}>Contact GoviGana 📞</Text>
            </Pressable>
          } 
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Support Card */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text style={styles.cardTitle}>Get in Touch</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              Have questions, feedback, or suggestions for GoviGana? Reach out to our team or report any pricing discrepancies.
            </Text>
            <Divider style={dividerStyle} />
            
            <List.Item
              title="Official Email"
              description="support@govigana.lk"
              left={props => <List.Icon {...props} icon="email-outline" color="#2E7D32" />}
              titleStyle={[styles.listItemTitle, { color: colors.text }]}
              descriptionStyle={[styles.listItemDesc, { color: colors.textSecondary }]}
              onPress={handleEmailPress}
            />
            <Divider style={miniDividerStyle} />

            <List.Item
              title="Developer Support"
              description="GitHub Issue Tracker"
              left={props => <List.Icon {...props} icon="github" color="#2E7D32" />}
              titleStyle={[styles.listItemTitle, { color: colors.text }]}
              descriptionStyle={[styles.listItemDesc, { color: colors.textSecondary }]}
              onPress={handleGithubPress}
            />
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button 
              icon="email" 
              mode="contained" 
              buttonColor="#2E7D32" 
              textColor="#ffffff"
              style={styles.actionBtn}
              onPress={handleEmailPress}
            >
              Send an Email
            </Button>
          </Card.Actions>
        </Card>

        {/* Agrarian Hotlines Card */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Agrarian Helpdesks</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              Direct contacts for Hector Kobbekaduwa Agrarian Research and Training Institute (HARTI) and related departments.
            </Text>
            <Divider style={dividerStyle} />

            <List.Item
              title="HARTI Main Hotline"
              description="+94 11 269 6981"
              left={props => <List.Icon {...props} icon="phone" color="#2E7D32" />}
              titleStyle={[styles.listItemTitle, { color: colors.text }]}
              descriptionStyle={[styles.listItemDesc, { color: colors.textSecondary }]}
              onPress={() => handleCallPress('+94112696981')}
            />
            <Divider style={miniDividerStyle} />

            <List.Item
              title="HARTI Price Info Desk"
              description="+94 11 269 6982"
              left={props => <List.Icon {...props} icon="phone-in-talk" color="#2E7D32" />}
              titleStyle={[styles.listItemTitle, { color: colors.text }]}
              descriptionStyle={[styles.listItemDesc, { color: colors.textSecondary }]}
              onPress={() => handleCallPress('+94112696982')}
            />
            <Divider style={miniDividerStyle} />

            <List.Item
              title="Mobitel Agri Hotline"
              description="Dial 6666 (SLAES Desk)"
              left={props => <List.Icon {...props} icon="cellphone" color="#2E7D32" />}
              titleStyle={[styles.listItemTitle, { color: colors.text }]}
              descriptionStyle={[styles.listItemDesc, { color: colors.textSecondary }]}
              onPress={() => handleCallPress('6666')}
            />
          </Card.Content>
        </Card>

        {/* Open Source Contribution Card */}
        <Card style={cardStyle}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Contribute Code</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              GoviGana is built by the community. You can fork the repository, file code issues, or submit Pull Requests on GitHub to add features or fix bugs.
            </Text>
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button 
              icon="git" 
              mode="outlined" 
              textColor="#2E7D32"
              style={[styles.actionBtn, styles.outlineBtn]}
              onPress={handleGithubPress}
            >
              Open Repository
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
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
  },
  descText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginTop: 6,
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
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  outlineBtn: {
    borderColor: '#2E7D32',
    borderWidth: 1.5,
  },
});
