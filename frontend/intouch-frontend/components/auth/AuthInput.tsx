import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface AuthInputProps extends TextInputProps {
  error?: boolean;
}

export function AuthInput({ error, style, ...props }: AuthInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.background,
          borderColor: error ? '#ef4444' : '#e5e7eb',
          color: colors.text,
        },
        style,
      ]}
      placeholderTextColor={colors.icon}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
});

