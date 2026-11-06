/**
 * PriestBookingTabs Component
 * Segmented Booking Tabs (கடந்தவை, நிகழ்வு, அடுத்தவை) and Context-Aware Summary Bar.
 *
 * Implements:
 * - Equal-height tabs with no text overlap and smooth tab selection.
 * - Dynamically updates summary title and count according to the currently active tab:
 *   - 'active' => "தற்போதைய நிகழ்வு | Active Pooja" with active count
 *   - 'upcoming' => "அடுத்து திட்டமிடப்பட்டவை | Scheduled" with upcoming count
 *   - 'past' => "நிறைவடைந்தவை | Completed" with past count
 * - 100% synchronization with passed tabCounts and selected tab.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { PriestBookingTab, PriestTabCounts } from '../../types/priest';

interface PriestBookingTabsProps {
  activeTab: PriestBookingTab;
  onSelectTab: (tab: PriestBookingTab) => void;
  tabCounts?: PriestTabCounts;
  scheduledCount?: number;
}

const DEFAULT_TAB_COUNTS: PriestTabCounts = {
  past: 0,
  active: 0,
  upcoming: 0,
};

export const PriestBookingTabs: React.FC<PriestBookingTabsProps> = ({
  activeTab,
  onSelectTab,
  tabCounts = DEFAULT_TAB_COUNTS,
}) => {
  const { t } = useTranslation();
  const counts = tabCounts || DEFAULT_TAB_COUNTS;

  const getSummaryInfo = () => {
    switch (activeTab) {
      case 'active':
        return {
          titleTamil: t('priest.tabTitles.active'),
          subtitleEnglish: t('priest.tabSubtitles.active'),
          countText: counts.active === 1 ? t('priest.singlePoojaCount') : t('priest.poojaCount', { count: counts.active }),
        };
      case 'upcoming':
        return {
          titleTamil: t('priest.tabTitles.upcoming'),
          subtitleEnglish: t('priest.tabSubtitles.upcoming'),
          countText: t('priest.poojaCount', { count: counts.upcoming }),
        };
      case 'past':
        return {
          titleTamil: t('priest.tabTitles.past'),
          subtitleEnglish: t('priest.tabSubtitles.past'),
          countText: t('priest.poojaCount', { count: counts.past }),
        };
    }
  };

  const summary = getSummaryInfo();

  return (
    <View style={styles.container}>
      {/* 1. Equal-Height Segmented Tabs */}
      <View style={styles.segmentedControl}>
        {/* Tab 1: கடந்தவை (Past) */}
        <Pressable
          onPress={() => onSelectTab('past')}
          style={[
            styles.tabButton,
            activeTab === 'past' && styles.tabButtonActive,
          ]}
          accessibilityRole="tab"
          accessibilityLabel={`${t('priest.tabs.past')} ${counts.past}`}
          accessibilityState={{ selected: activeTab === 'past' }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.tabTextActive,
            ]}
          >
            {t('priest.tabs.past')} ({counts.past})
          </Text>
        </Pressable>

        {/* Tab 2: நிகழ்வு (Active/Current) */}
        <Pressable
          onPress={() => onSelectTab('active')}
          style={[
            styles.tabButton,
            activeTab === 'active' && styles.tabButtonActive,
          ]}
          accessibilityRole="tab"
          accessibilityLabel={`${t('priest.tabs.active')} ${counts.active}`}
          accessibilityState={{ selected: activeTab === 'active' }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.tabTextActive,
            ]}
          >
            {t('priest.tabs.active')} ({counts.active})
          </Text>
        </Pressable>

        {/* Tab 3: அடுத்தவை (Upcoming) */}
        <Pressable
          onPress={() => onSelectTab('upcoming')}
          style={[
            styles.tabButton,
            activeTab === 'upcoming' && styles.tabButtonActive,
          ]}
          accessibilityRole="tab"
          accessibilityLabel={`${t('priest.tabs.upcoming')} ${counts.upcoming}`}
          accessibilityState={{ selected: activeTab === 'upcoming' }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.tabTextActive,
            ]}
          >
            {t('priest.tabs.upcoming')} ({counts.upcoming})
          </Text>
        </Pressable>
      </View>


      {/* 2. Context-Aware Summary Information Row */}
      <View style={styles.scheduledInfoRow}>
        <View style={styles.scheduledLeft}>
          <Text style={styles.scheduledTitle}>{summary.titleTamil}</Text>
          <Text style={styles.divider}>|</Text>
          <Text style={styles.scheduledSubtitle}>{summary.subtitleEnglish}</Text>
        </View>

        <Text style={styles.scheduledCountText}>
          {summary.countText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E6ECE9',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#074735', // Deep Forest Green
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scheduledInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  scheduledLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  scheduledTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F2F24',
    lineHeight: 18,
  },
  divider: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  scheduledSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 16,
  },
  scheduledCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#074735',
    lineHeight: 18,
  },
});
