/**
 * DashboardBottomNav Component
 * Section 7: Bottom navigation bar with 4 tabs matching the approved design:
 * 1. முகப்பு (Home/Temple icon)
 * 2. நாள்வாரி (Calendar icon)
 * 3. புரோகிதர் (Users icon)
 * 4. அமைப்புகள் (Settings icon)
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, Settings, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { TempleGopuramIcon } from '../common/TempleGopuramIcon';
import { DashboardBottomTabId } from '../../types/dashboard';

export type DashboardTabId = DashboardBottomTabId;

interface DashboardBottomNavProps {
  activeTab?: DashboardBottomTabId;
  onTabPress?: (tabId: DashboardBottomTabId) => void;
}

export const DashboardBottomNav: React.FC<DashboardBottomNavProps> = ({
  activeTab: controlledActiveTab,
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [internalActiveTab, setInternalActiveTab] =
    useState<DashboardBottomTabId>('home');

  const activeTab = controlledActiveTab ?? internalActiveTab;
  const isSettingsActive = activeTab === 'settings' || activeTab === 'profile';

  const handlePress = (tabId: DashboardBottomTabId) => {
    setInternalActiveTab(tabId);
    onTabPress?.(tabId);
  };

  return (
    <View
      style={[
        styles.navContainer,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {/* Tab 1: முகப்பு (Home) */}
      <Pressable
        onPress={() => handlePress('home')}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel={t('nav.home')}
        accessibilityState={{ selected: activeTab === 'home' }}
      >
        <TempleGopuramIcon
          size={22}
          color={activeTab === 'home' ? '#074735' : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'home' && styles.tabLabelActive,
          ]}
        >
          {t('nav.home')}
        </Text>
      </Pressable>

      {/* Tab 2: நாள்வாரி (Calendar) */}
      <Pressable
        onPress={() => handlePress('date')}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel={t('nav.schedule')}
        accessibilityState={{ selected: activeTab === 'date' }}
      >
        <Calendar
          size={22}
          color={activeTab === 'date' ? '#074735' : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'date' && styles.tabLabelActive,
          ]}
        >
          {t('nav.schedule')}
        </Text>
      </Pressable>

      {/* Tab 3: புரோகிதர் (Priests/Users) */}
      <Pressable
        onPress={() => handlePress('priest')}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel={t('nav.priest')}
        accessibilityState={{ selected: activeTab === 'priest' }}
      >
        <Users
          size={22}
          color={activeTab === 'priest' ? '#074735' : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'priest' && styles.tabLabelActive,
          ]}
        >
          {t('nav.priest')}
        </Text>
      </Pressable>

      {/* Tab 4: அமைப்புகள் (Settings) */}
      <Pressable
        onPress={() => handlePress('settings')}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel={t('nav.settings')}
        accessibilityState={{ selected: isSettingsActive }}
      >
        <Settings
          size={22}
          color={isSettingsActive ? '#074735' : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            isSettingsActive && styles.tabLabelActive,
          ]}
        >
          {t('nav.settings')}
        </Text>
      </Pressable>
    </View>
  );

};

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 8,
    zIndex: 90,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#074735',
    fontWeight: '800',
  },
});
