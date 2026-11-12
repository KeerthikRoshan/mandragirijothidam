/**
 * DashboardHeader Component
 * Section 1: Dashboard header with brand logo & title container on the left,
 * and a styled notification icon container on the right.
 */

import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { ASSETS } from '../../constants/assets';

interface DashboardHeaderProps {
  brandTitle?: string;
  notificationCount?: number;
  onPressNotifications?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  brandTitle = 'மந்திரகிரி ஆஸ்ட்ரோ',
  notificationCount = 0,
  onPressNotifications,
}) => {
  return (
    <View style={styles.container}>
      {/* Left Container: Logo & Brand Title */}
      <View style={styles.leftContainer}>
        <View style={styles.logoContainer}>
          <Image
             source={ASSETS.images.logo}
            style={styles.logoImage}
            resizeMode="cover"
            accessibilityLabel={brandTitle}
            accessibilityRole="image"
          />
        </View>
        <Text style={styles.brandTitle} numberOfLines={1}>
          {brandTitle}
        </Text>
      </View>

      {/* Right Container: Notification Icon */}
      <View style={styles.rightContainer}>
        <Pressable
          onPress={onPressNotifications}
          accessibilityRole="button"
          accessibilityLabel={
            notificationCount > 0
              ? `Notifications, ${notificationCount} unread`
              : 'Notifications'
          }
          style={styles.notificationButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Bell size={20} color="#2D3748" />
          {notificationCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF9F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  logoContainer: {
    width: 38,
    height: 38,  
    // borderRadius: 10,
    // overflow: 'hidden',
    // backgroundColor: '#063D2E',
    // borderWidth: 1,
    // borderColor: '#E2D3B3',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.08,
    // shadowRadius: 3,
    // elevation: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#8C6D23', // Temple gold/olive tone matching reference
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 11,
  },
});
