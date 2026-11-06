/**
 * StaffBottomNav Component
 * Primary Bottom Navigation for Mandhragiri Jothidam Priest & Assistant Portal
 *
 * Tabs:
 * 1. Home / முகப்பு (Staff Dashboard)
 * 2. My Events / நிகழ்வுகள் (Assigned events & completions)
 * 3. Attendance / வருகை (Personal monthly history)
 * 4. Reminders / நினைவூட்டல் (Actionable reminders)
 * 5. More / மேலும் (Leave applications, profile, sign out)
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Bell,
  CalendarCheck,
  ClipboardList,
  Home,
  MoreHorizontal,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export type StaffTabId = 'home' | 'events' | 'attendance' | 'reminders' | 'more';

interface StaffBottomNavProps {
  activeTab: StaffTabId;
  staffId?: string;
}

export const StaffBottomNav: React.FC<StaffBottomNavProps> = ({
  activeTab,
  staffId,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handleTabPress = (tabId: StaffTabId) => {
    if (tabId === activeTab) return;

    switch (tabId) {
      case 'home':
        navigation.navigate('StaffDashboard', { staffId });
        break;
      case 'events':
        navigation.navigate('StaffEvents', { staffId });
        break;
      case 'attendance':
        navigation.navigate('StaffAttendance', { staffId });
        break;
      case 'reminders':
        navigation.navigate('StaffReminders', { staffId });
        break;
      case 'more':
        navigation.navigate('StaffMore', { staffId });
        break;
    }
  };

  return (
    <View
      style={[
        styles.navContainer,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {/* 1. Home / முகப்பு */}
      <Pressable
        onPress={() => handleTabPress('home')}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel="முகப்பு (Home)"
        accessibilityState={{ selected: activeTab === 'home' }}
      >
        <Home
          size={20}
          color={activeTab === 'home' ? '#074735' : '#64748B'}
          strokeWidth={activeTab === 'home' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'home' && styles.tabLabelActive,
          ]}
        >
          முகப்பு
        </Text>
      </Pressable>

      {/* 2. My Events / நிகழ்வுகள் */}
      <Pressable
        onPress={() => handleTabPress('events')}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel="நிகழ்வுகள் (My Events)"
        accessibilityState={{ selected: activeTab === 'events' }}
      >
        <ClipboardList
          size={20}
          color={activeTab === 'events' ? '#074735' : '#64748B'}
          strokeWidth={activeTab === 'events' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'events' && styles.tabLabelActive,
          ]}
        >
          நிகழ்வுகள்
        </Text>
      </Pressable>

      {/* 3. Attendance / வருகை */}
      <Pressable
        onPress={() => handleTabPress('attendance')}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel="வருகை (My Attendance)"
        accessibilityState={{ selected: activeTab === 'attendance' }}
      >
        <CalendarCheck
          size={20}
          color={activeTab === 'attendance' ? '#074735' : '#64748B'}
          strokeWidth={activeTab === 'attendance' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'attendance' && styles.tabLabelActive,
          ]}
        >
          வருகை
        </Text>
      </Pressable>

      {/* 4. Reminders / நினைவூட்டல் */}
      <Pressable
        onPress={() => handleTabPress('reminders')}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel="நினைவூட்டல் (Reminders)"
        accessibilityState={{ selected: activeTab === 'reminders' }}
      >
        <Bell
          size={20}
          color={activeTab === 'reminders' ? '#074735' : '#64748B'}
          strokeWidth={activeTab === 'reminders' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'reminders' && styles.tabLabelActive,
          ]}
        >
          நினைவூட்டல்
        </Text>
      </Pressable>

      {/* 5. More / மேலும் */}
      <Pressable
        onPress={() => handleTabPress('more')}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel="மேலும் (More)"
        accessibilityState={{ selected: activeTab === 'more' }}
      >
        <MoreHorizontal
          size={20}
          color={activeTab === 'more' ? '#074735' : '#64748B'}
          strokeWidth={activeTab === 'more' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'more' && styles.tabLabelActive,
          ]}
        >
          மேலும்
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2DDD1',
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#074735',
    fontWeight: '700',
  },
});
