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

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister() {
    setSubmitting(true);
    setError(null);
    try {
      await register(email.trim(), password);
    } catch (e: any) {
      setError(e.message ?? 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Kitchen Companion</Text>
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
        <>
          <Pressable style={s.button} onPress={handleLogin}>
            <Text style={s.buttonText}>Log in</Text>
          </Pressable>
          <Pressable style={[s.button, s.secondary]} onPress={handleRegister}>
            <Text style={s.buttonText}>Register</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}