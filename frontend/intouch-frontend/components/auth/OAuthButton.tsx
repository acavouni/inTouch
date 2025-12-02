import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface OAuthButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string; // Custom label override
}

export function OAuthButton({ provider, onPress, loading = false, disabled = false, label: customLabel }: OAuthButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isGoogle = provider === 'google';
  const iconName = isGoogle ? 'logo-google' : 'logo-apple';
  const defaultLabel = isGoogle ? 'Continue with Google' : 'Continue with Apple';
  const label = customLabel || defaultLabel;
  const backgroundColor = isGoogle ? '#fff' : '#000';
  const textColor = isGoogle ? '#000' : '#fff';
  const borderColor = colorScheme === 'dark' ? '#374151' : '#e5e7eb';

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
      <View style={styles.content}>
        <Ionicons
          name={iconName as any}
          size={20}
          color={disabled ? '#fff' : textColor}
          style={styles.icon}
        />
        <Text style={[styles.buttonText, { color: disabled ? '#fff' : textColor }]}>
          {label}
        </Text>
      </View>
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
    marginBottom: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

