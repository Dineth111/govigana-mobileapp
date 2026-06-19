import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, useColorScheme, View, StyleSheet, useWindowDimensions, Platform, Image } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, Spacing } from '@/constants/theme';

interface TabButtonProps extends TabTriggerSlotProps {
  icon?: any;
}

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon={require('@/assets/images/tabIcons/home.png')}>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon={require('@/assets/images/tabIcons/explore.png')}>Resources</TabButton>
          </TabTrigger>
          <TabTrigger name="about" href="/about" asChild>
            <TabButton icon={require('@/assets/images/tabIcons/about.png')}>About</TabButton>
          </TabTrigger>
          <TabTrigger name="contact" href="/contact" asChild>
            <TabButton icon={require('@/assets/images/tabIcons/contact.png')}>Contact</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, icon, ...props }: TabButtonProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 600;

  // Premium GoviGana Green active color, fallback to theme text colors
  const activeColor = isDark ? '#4CAF50' : '#2E7D32';
  const inactiveColor = isDark ? '#B0B4BA' : '#60646C';

  return (
    <Pressable 
      {...props} 
      style={({ pressed }) => [
        styles.tabButtonPressable,
        !isLargeScreen && styles.mobileTabButton,
        pressed && styles.pressed
      ]}
    >
      <View style={[
        styles.tabButtonView,
        !isLargeScreen && styles.mobileTabButtonView,
        isFocused && isLargeScreen && { backgroundColor: isDark ? '#2E3135' : '#E0E1E6' }
      ]}>
        {icon && (
          <Image
            source={icon}
            style={[
              styles.tabIcon,
              { tintColor: isFocused ? activeColor : inactiveColor }
            ]}
          />
        )}
        <ThemedText 
          style={[
            styles.tabLabel,
            { color: isFocused ? activeColor : inactiveColor, fontWeight: isFocused ? '700' : '500' }
          ]}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

import { router } from 'expo-router';

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 600;

  const containerStyle = [
    styles.innerContainer,
    isLargeScreen ? styles.desktopContainer : [
      styles.mobileContainer,
      {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      }
    ]
  ];

  return (
    <View {...props} pointerEvents="box-none" style={isLargeScreen ? styles.desktopTabListContainer : styles.mobileTabListContainer}>
      <ThemedView type="backgroundElement" style={containerStyle}>
        {isLargeScreen && (
          <Pressable onPress={() => router.replace('/')}>
            <ThemedText type="smallBold" style={styles.brandText}>
              GoviGana 🌾
            </ThemedText>
          </Pressable>
        )}

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Desktop Container
  desktopTabListContainer: {
    position: 'fixed' as any,
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 1000,
  },
  desktopContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },

  // Mobile Container
  mobileTabListContainer: {
    position: 'fixed' as any,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingHorizontal: Spacing.three,
  },
  mobileContainer: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
  },

  // Button Styles
  tabButtonPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileTabButton: {
    flex: 1,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  mobileTabButtonView: {
    flexDirection: 'column',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  tabIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  tabLabel: {
    fontSize: 11,
  },
  brandText: {
    marginRight: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
