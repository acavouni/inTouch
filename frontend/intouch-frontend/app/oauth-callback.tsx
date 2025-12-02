import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// Complete OAuth flow in web browser
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // The OAuth flow should have already completed in the sign-in/sign-up screens
    // This callback is mainly for handling the deep link redirect
    // Wait a moment for the OAuth flow to complete, then redirect
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

