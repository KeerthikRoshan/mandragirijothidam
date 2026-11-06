/**
 * NewBookingButton Component
 * Section 6: Floating Action Button for "+ பூஜை பதிவு (New)" with dark forest-green pill,
 * gold accents, and subtle elevation shadow.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Plus } from 'lucide-react-native';

interface NewBookingButtonProps {
  onPress?: () => void;
  title?: string;
  subtext?: string;
  bottomOffset?: number;
  align?: 'left' | 'right';
}

export const NewBookingButton: React.FC<NewBookingButtonProps> = ({
  onPress,
  title = '+ பூஜை பதிவு',
  subtext = '(New)',
  bottomOffset = 64,
  align = 'right',
}) => {
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingContainer,
        align === 'left' ? styles.alignLeft : styles.alignRight,
        { bottom: bottomOffset },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={styles.pillButton}
        accessibilityRole="button"
        accessibilityLabel={`${title} ${subtext}`}
      >
        <Plus size={16} color="#E5B84A" strokeWidth={2.5} style={styles.plusIcon} />
        <Text style={styles.titleText}>{title.replace(/^\+\s*/, '')}</Text>
        <Text style={styles.subtextText}>{subtext}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    zIndex: 99,
  },
  alignRight: {
    right: 16,
  },
  alignLeft: {
    left: 16,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#043B2C', // Deep Vedic forest green matching reference
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(229, 184, 74, 0.4)', // Subtle gold border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  plusIcon: {
    marginRight: 6,
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  subtextText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E5B84A', // Gold
    marginLeft: 5,
  },
});
