import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, Linking } from 'react-native';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { OAuthButton } from '@/components/auth/OAuthButton';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Complete OAuth flow in web browser
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleEmailSignIn = async () => {
    if (!isLoaded) return;

    if (!identifier || !password) {
      setError('Please enter both username/email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: identifier,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const startOAuthFlow = strategy === 'oauth_google' ? startGoogleOAuth : startAppleOAuth;
      const redirectUrl = 'intouchfrontend://oauth-callback';
      
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl,
      });
      
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      } else {
        // OAuth completed but no session was created
        setError('OAuth sign-in incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || `Failed to sign in with ${strategy === 'oauth_google' ? 'Google' : 'Apple'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => handleOAuthSignIn('oauth_google');
  const handleAppleSignIn = () => handleOAuthSignIn('oauth_apple');

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Sign in to continue
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <AuthInput
            placeholder="Username or Email"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoComplete="username"
            error={!!error}
          />

          <AuthInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            error={!!error}
          />

          <AuthButton
            title="Sign In"
            onPress={handleEmailSignIn}
            loading={loading}
            disabled={!identifier || !password}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.icon }]} />
            <Text style={[styles.dividerText, { color: colors.icon }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.icon }]} />
          </View>

          <OAuthButton
            provider="google"
            onPress={handleGoogleSignIn}
            loading={loading}
            disabled={loading}
            label="Sign In with Google"
          />

          {Platform.OS === 'ios' && (
            <OAuthButton
              provider="apple"
              onPress={handleAppleSignIn}
              loading={loading}
              disabled={loading}
              label="Sign In with Apple"
            />
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.icon }]}>
              Don't have an account?{' '}
            </Text>
            <Text
              style={[styles.footerLink, { color: colors.tint }]}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              Sign Up
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

