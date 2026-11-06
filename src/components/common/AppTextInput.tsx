/**
 * AppTextInput Component
 * Reusable outlined input field for Mandhragiri Jothidam
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { typography } from '../../constants/typography';

export interface AppTextInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  prefix?: string;
  rightElement?: React.ReactNode;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  prefix,
  rightElement,
  style,
  onFocus,
  onBlur,
  editable = true,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputProps['onFocus'] = e => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = e => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = error
    ? colors.borderError
    : isFocused
    ? colors.borderFocused
    : colors.border;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          { borderColor },
          !editable && styles.disabledContainer,
        ]}
      >
        {prefix ? (
          <View style={styles.prefixWrapper}>
            <Text style={styles.prefixText}>{prefix}</Text>
            <View style={styles.prefixDivider} />
          </View>
        ) : null}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          {...restProps}
        />

        {rightElement ? (
          <View style={styles.rightElementWrapper}>{rightElement}</View>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1.2,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  disabledContainer: {
    backgroundColor: colors.inputDisabled,
  },
  prefixWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
  },
  prefixText: {
    ...typography.input,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  prefixDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
    marginLeft: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.input,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  rightElementWrapper: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.error,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
