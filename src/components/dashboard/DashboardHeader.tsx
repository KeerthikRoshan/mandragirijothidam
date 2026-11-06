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
          accessibilityLabel="Notifications"
          style={styles.notificationButton}
          // hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Bell size={20} color="#2D3748" />
          {notificationCount > 0 && <View style={styles.badgeDot} />}
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
    // borderWidth: 1,
    // borderColor: '#E5E7EB',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 1.5,
    // position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});
