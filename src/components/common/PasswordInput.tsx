/**
 * PasswordInput Component
 * Secure password input field with accessible visibility toggle
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { AppTextInput, AppTextInputProps } from './AppTextInput';

export interface PasswordInputProps
  extends Omit<AppTextInputProps, 'secureTextEntry' | 'rightElement'> {
  // Inherits all standard input props
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  ...restProps
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  const visibilityButton = (
    <Pressable
      onPress={toggleVisibility}
      accessibilityRole="button"
      accessibilityLabel={
        isVisible ? 'கடவுச்சொல்லை மறைக்கவும்' : 'கடவுச்சொல்லைக் காட்டவும்'
      }
      accessibilityHint="கடவுச்சொல் தெரிவுநிலையை மாற்றுகிறது"
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={styles.toggleButton}
    >
      {isVisible ? (
        <EyeOff size={20} color={colors.textSecondary} />
      ) : (
        <Eye size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );

  return (
    <AppTextInput
      label={label}
      error={error}
      secureTextEntry={!isVisible}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="password"
      textContentType="password"
      rightElement={visibilityButton}
      {...restProps}
    />
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
