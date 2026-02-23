import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from 'auth/AuthProvider';
import { useAccountApi } from '../../../api/account';
import { s } from './AccountScreen.styles';

export default function AccountScreen() {
  const { plan, logout, updateToken } = useAuth();
  const { getMe, changePassword, updatePlan } = useAccountApi();

  const [email, setEmail] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [switching, setSwitching] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setEmail(me.email);
      } catch (e: any) {
        console.log('Failed to load account info:', e?.message);
      } finally {
        setLoadingInfo(false);
      }
    })();
  }, []);

  async function handlePlanSwitch(newPlan: 'free' | 'premium') {
    if (newPlan === plan) return;
    setSwitching(true);
    try {
      const result = await updatePlan(newPlan);
      await updateToken(result.access_token, result.refresh_token);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update plan');
    } finally {
      setSwitching(false);
    }
  }

  async function handleChangePassword() {
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setPasswordError(e.message ?? 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }

  if (loadingInfo) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <Text style={s.label}>Email</Text>
        <Text style={s.value}>{email}</Text>
        <Text style={s.label}>Current plan</Text>
        <Text style={s.value}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Switch Plan</Text>
        {switching ? (
          <ActivityIndicator />
        ) : (
          <View style={s.planRow}>
            <Pressable
              style={[s.planButton, plan === 'free' && s.planButtonActive]}
              onPress={() => handlePlanSwitch('free')}
            >
              <Text style={[s.planButtonText, plan === 'free' && s.planButtonTextActive]}>
                Free
              </Text>
            </Pressable>
            <Pressable
              style={[s.planButton, plan === 'premium' && s.planButtonActive]}
              onPress={() => handlePlanSwitch('premium')}
            >
              <Text style={[s.planButtonText, plan === 'premium' && s.planButtonTextActive]}>
                Premium
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Change Password</Text>
        <TextInput
          style={s.input}
          placeholder="Current password"
          secureTextEntry
          autoCapitalize="none"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={s.input}
          placeholder="New password"
          secureTextEntry
          autoCapitalize="none"
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={s.input}
          placeholder="Confirm new password"
          secureTextEntry
          autoCapitalize="none"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {passwordError ? <Text style={s.error}>{passwordError}</Text> : null}
        {passwordSuccess ? <Text style={s.success}>{passwordSuccess}</Text> : null}
        {changingPassword ? (
          <ActivityIndicator style={{ marginTop: 8 }} />
        ) : (
          <Pressable style={s.button} onPress={handleChangePassword}>
            <Text style={s.buttonText}>Change Password</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={s.logoutButton} onPress={logout}>
        <Text style={s.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}
