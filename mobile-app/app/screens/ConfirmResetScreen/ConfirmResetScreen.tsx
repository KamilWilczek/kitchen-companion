import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from 'App';
import { confirmPasswordReset } from 'api/auth';
import { s } from './ConfirmResetScreen.styles';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ConfirmReset'>;
type RoutePropType = RouteProp<RootStackParamList, 'ConfirmReset'>;

export default function ConfirmResetScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { email } = route.params;

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  async function handleSubmit() {
    if (!code.trim() || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await confirmPasswordReset(email, code.trim(), password);
      navigation.navigate('Auth', { resetSuccess: true });
    } catch (e: any) {
      setError(e.message ?? 'Invalid or expired code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Enter your code</Text>
      <Text style={s.subtitle}>
        We sent a 6-digit code to{' '}
        <Text style={s.email}>{email}</Text>
      </Text>

      <TextInput
        style={[s.input, s.codeInput]}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        value={code}
        onChangeText={setCode}
        onSubmitEditing={() => passwordRef.current?.focus()}
        returnKeyType="next"
      />

      <TextInput
        ref={passwordRef}
        style={s.input}
        placeholder="New password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => confirmRef.current?.focus()}
        returnKeyType="next"
      />

      <TextInput
        ref={confirmRef}
        style={s.input}
        placeholder="Confirm new password"
        secureTextEntry
        autoCapitalize="none"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />

      {error ? <Text style={s.error}>{error}</Text> : null}

      {submitting ? (
        <ActivityIndicator style={{ marginTop: 16 }} color="#F97316" />
      ) : (
        <Pressable style={s.button} onPress={handleSubmit}>
          <Text style={s.buttonText}>Reset password</Text>
        </Pressable>
      )}
    </View>
  );
}
