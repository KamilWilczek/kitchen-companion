import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from 'App';
import { requestPasswordReset } from 'api/auth';
import { s } from './RequestResetScreen.styles';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'RequestReset'>;

export default function RequestResetScreen() {
  const navigation = useNavigation<NavProp>();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      navigation.navigate('ConfirmReset', { email: email.trim() });
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Forgot password?</Text>
      <Text style={s.subtitle}>
        Enter your email and we'll send you a 6-digit code to reset your password.
      </Text>

      <TextInput
        style={s.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoFocus
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
      />

      {error ? <Text style={s.error}>{error}</Text> : null}

      {submitting ? (
        <ActivityIndicator style={{ marginTop: 16 }} color="#F97316" />
      ) : (
        <Pressable style={s.button} onPress={handleSubmit}>
          <Text style={s.buttonText}>Send code</Text>
        </Pressable>
      )}
    </View>
  );
}
