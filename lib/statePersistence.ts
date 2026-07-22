import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  DISCOVERY_INDEX: 'divine:discovery_index',
  DRAFT_MESSAGE: 'divine:draft_message',
  LAST_TAB: 'divine:last_tab',
};

export async function saveDiscoveryPosition(index: number) {
  await AsyncStorage.setItem(KEYS.DISCOVERY_INDEX, String(index));
}

export async function getDiscoveryPosition(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.DISCOVERY_INDEX);
  return val ? parseInt(val, 10) : 0;
}

export async function saveDraftMessage(matchId: string, text: string) {
  if (text) {
    await AsyncStorage.setItem(`${KEYS.DRAFT_MESSAGE}:${matchId}`, text);
  } else {
    await AsyncStorage.removeItem(`${KEYS.DRAFT_MESSAGE}:${matchId}`);
  }
}

export async function getDraftMessage(matchId: string): Promise<string> {
  return (await AsyncStorage.getItem(`${KEYS.DRAFT_MESSAGE}:${matchId}`)) || '';
}

export async function saveLastTab(tab: string) {
  await AsyncStorage.setItem(KEYS.LAST_TAB, tab);
}

export async function getLastTab(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.LAST_TAB);
}
