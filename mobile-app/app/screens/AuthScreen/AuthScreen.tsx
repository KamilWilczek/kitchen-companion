import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from 'auth/AuthProvider';
import { s } from './AuthScreen.styles';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode() {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    } catch (e: any) {
      setError(e.message ?? (mode === 'login' ? 'Login failed' : 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <View style={s.container}>
      <Text style={s.title}>Kitchen Companion</Text>
      <Text style={s.subtitle}>{isLogin ? 'Log in' : 'Create account'}</Text>

      <TextInput
        style={s.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={s.error}>{error}</Text> : null}

      {submitting ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : (
        <Pressable style={s.button} onPress={handleSubmit}>
          <Text style={s.buttonText}>{isLogin ? 'Log in' : 'Create account'}</Text>
        </Pressable>
      )}

      <Pressable onPress={switchMode} style={s.switchLink}>
        <Text style={s.switchLinkText}>
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Log in'}
        </Text>
      </Pressable>
    </View>
  );
}
