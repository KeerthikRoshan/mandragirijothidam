/**
 * PrimaryButton Component
 * Forest-green button adhering to Mandhragiri Jothidam design system
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { typography } from '../../constants/typography';

export interface PrimaryButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  loading = false,
  disabled = false,
  onPress,
  style,
  ...restProps
}) => {
  const isButtonDisabled = disabled || loading;

  const handlePress: PressableProps['onPress'] = e => {
    if (isButtonDisabled) return;
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isButtonDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isButtonDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isButtonDisabled && styles.disabledButton,
        pressed && !isButtonDisabled && styles.pressedButton,
        style,
      ]}
      {...restProps}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.textInverse} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  disabledButton: {
    backgroundColor: colors.buttonDisabled,
  },
  pressedButton: {
    backgroundColor: colors.primaryDark,
  },
  text: {
    ...typography.button,
    color: colors.textInverse,
  },
});
