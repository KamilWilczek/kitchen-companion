import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "kc:userId";

export async function getOrCreateUserId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;
  const id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await AsyncStorage.setItem(KEY, id);
  return id;
}