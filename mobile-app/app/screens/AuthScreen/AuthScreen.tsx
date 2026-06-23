import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from 'App';
import { useAuth } from 'auth/AuthProvider';
import { s } from './AuthScreen.styles';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;
type AuthRouteProp = RouteProp<RootStackParamList, 'Auth'>;

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<AuthRouteProp>();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.resetSuccess) {
      setSuccessMsg('Password updated! Log in with your new password.');
    }
  }, [route.params?.resetSuccess]);

  function switchMode() {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    setError(null);
    setSuccessMsg(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
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
        returnKeyType="next"
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />

      {successMsg ? <Text style={s.success}>{successMsg}</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      {submitting ? (
        <ActivityIndicator style={{ marginTop: 16 }} color="#F97316" />
      ) : (
        <Pressable style={s.button} onPress={handleSubmit}>
          <Text style={s.buttonText}>{isLogin ? 'Log in' : 'Create account'}</Text>
        </Pressable>
      )}

      {isLogin && (
        <Pressable onPress={() => navigation.navigate('RequestReset')} style={s.forgotLink}>
          <Text style={s.forgotLinkText}>Forgot password?</Text>
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
