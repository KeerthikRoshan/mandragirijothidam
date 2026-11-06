/**
 * AddFunctionButton Component
 * Fixed bottom action button to add a new function/booking:
 * "+ புதிய பதிவு சேர்க்க (+Add Function)"
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Plus } from 'lucide-react-native';

interface AddFunctionButtonProps {
  onPress: () => void;
}

export const AddFunctionButton: React.FC<AddFunctionButtonProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="புதிய பதிவு சேர்க்க"
      >
        <Plus size={20} color="#C5A869" style={styles.icon} />
        <Text style={styles.buttonText}>
          புதிய பதிவு சேர்க்க <Text style={styles.englishSubtext}>(+Add Function)</Text>
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  button: {
    backgroundColor: '#074735', // Deep Forest Green
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C5A869', // Rich Gold Border
    shadowColor: '#074735',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  englishSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2D3B3', // Soft gold
  },
});
