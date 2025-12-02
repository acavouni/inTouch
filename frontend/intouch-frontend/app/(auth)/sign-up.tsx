import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { OAuthButton } from '@/components/auth/OAuthButton';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Complete OAuth flow in web browser
WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingUsername, setPendingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleEmailSignUp = async () => {
    if (!isLoaded) return;

    if (!email || !password || !username) {
      setError('Please enter email, username, and password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp.create({
        emailAddress: email,
        password,
        username,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded || !signUp) return;

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(tabs)');
      } else if (completeSignUp.status === 'missing_requirements') {
        // If username is still missing after verification, set it
        if (username && signUp.username !== username) {
          await signUp.update({ username });
          // Try to complete again
          const retryComplete = await signUp.attemptEmailAddressVerification({ code });
          if (retryComplete.status === 'complete') {
            await setActive({ session: retryComplete.createdSessionId });
            router.replace('/(tabs)');
          } else {
            setError('Verification incomplete. Please try again.');
          }
        } else {
          setError('Verification incomplete. Please try again.');
        }
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (strategy: 'oauth_google' | 'oauth_apple') => {
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
        // OAuth completed but sign-up might be incomplete
        // Check if username is missing
        if (signUp && !signUp.username) {
          setPendingUsername(true);
          setError('Please enter a username to complete your profile');
        } else {
          setError('OAuth sign-up incomplete. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || `Failed to sign up with ${strategy === 'oauth_google' ? 'Google' : 'Apple'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOAuthSignUp = async () => {
    if (!isLoaded || !signUp || !username) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update the sign-up with username
      await signUp.update({ username });
      
      // After updating username, check if sign-up is complete
      if (signUp.status === 'complete') {
        // Sign-up is complete, set active session
        if (signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
          router.replace('/(tabs)');
        } else {
          setError('Sign-up complete! Please sign in.');
          setTimeout(() => router.replace('/(auth)/sign-in'), 2000);
        }
      } else {
        // If still incomplete, there might be other missing fields
        setError('Please complete all required fields.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to complete sign-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => handleOAuthSignUp('oauth_google');
  const handleAppleSignUp = () => handleOAuthSignUp('oauth_apple');

  if (pendingUsername) {
    return (
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Please choose a username to continue
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <AuthInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
              error={!!error}
              autoFocus
            />

            <AuthButton
              title="Complete Sign Up"
              onPress={handleCompleteOAuthSignUp}
              loading={loading}
              disabled={!username}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (pendingVerification) {
    return (
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            We sent a verification code to {email}
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <AuthInput
              placeholder="Enter 6-digit code"
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              error={!!error}
              autoFocus
            />

            <AuthButton
              title="Verify Code"
              onPress={handleVerifyCode}
              loading={loading}
              disabled={code.length !== 6}
            />

            <View style={styles.footer}>
              <Text
                style={[styles.footerLink, { color: colors.tint }]}
                onPress={() => {
                  setPendingVerification(false);
                  setCode('');
                  setError('');
                }}
              >
                Back to Sign Up
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Sign up to get started
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <AuthInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={!!error}
          />

          <AuthInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            error={!!error}
          />

          <AuthInput
            placeholder="Password (min. 8 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            error={!!error}
          />

          <AuthButton
            title="Sign Up"
            onPress={handleEmailSignUp}
            loading={loading}
            disabled={!email || !username || !password}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.icon }]} />
            <Text style={[styles.dividerText, { color: colors.icon }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.icon }]} />
          </View>

          <OAuthButton
            provider="google"
            onPress={handleGoogleSignUp}
            loading={loading}
            disabled={loading}
            label="Sign Up with Google"
          />

          {Platform.OS === 'ios' && (
            <OAuthButton
              provider="apple"
              onPress={handleAppleSignUp}
              loading={loading}
              disabled={loading}
              label="Sign Up with Apple"
            />
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.icon }]}>
              Already have an account?{' '}
            </Text>
            <Text
              style={[styles.footerLink, { color: colors.tint }]}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              Sign In
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

