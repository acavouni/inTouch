import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function AuthButton({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  disabled = false,
}: AuthButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isPrimary = variant === 'primary';
  const backgroundColor = isPrimary ? colors.tint : 'transparent';
  const textColor = isPrimary ? '#fff' : colors.tint;
  const borderColor = isPrimary ? 'transparent' : colors.tint;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? '#9ca3af' : backgroundColor,
          borderColor: disabled ? '#9ca3af' : borderColor,
        },
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : colors.tint} />
      ) : (
        <Text style={[styles.buttonText, { color: disabled ? '#fff' : textColor }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 50,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

