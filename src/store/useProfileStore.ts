import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ResidentProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleNumber?: string;
  token?: string;
}

interface ProfileState {
  profile: ResidentProfile | null;
  isLoadingProfile: boolean;
  setProfile: (profile: ResidentProfile | null) => Promise<void>;
  loadProfile: () => Promise<void>;
  clearProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoadingProfile: true,
  setProfile: async (profile) => {
    try {
      if (profile) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
      } else {
        await AsyncStorage.removeItem('user_profile');
      }
      set({ profile });
    } catch (e) {
      console.error('Error saving profile to AsyncStorage:', e);
    }
  },
  loadProfile: async () => {
    set({ isLoadingProfile: true });
    try {
      const localProfileString = await AsyncStorage.getItem('user_profile');
      if (localProfileString) {
        set({ profile: JSON.parse(localProfileString) });
      }
    } catch (e) {
      console.error('Error loading profile from AsyncStorage:', e);
    } finally {
      set({ isLoadingProfile: false });
    }
  },
  clearProfile: async () => {
    try {
      await AsyncStorage.removeItem('user_profile');
      set({ profile: null });
    } catch (e) {
      console.error('Error clearing profile from AsyncStorage:', e);
    }
  },
}));
