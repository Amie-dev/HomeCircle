import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GuestProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleNumber?: string;
  token?: string;
  joinedAt?: string;
  avatarUrl?: string;
}

interface GuestProfileState {
  guestProfile: GuestProfile | null;
  isLoadingGuest: boolean;
  setGuestProfile: (profile: GuestProfile | null) => Promise<void>;
  loadGuestProfile: () => Promise<void>;
  clearGuestProfile: () => Promise<void>;
}

export const useGuestProfileStore = create<GuestProfileState>((set) => ({
  guestProfile: null,
  isLoadingGuest: true,
  setGuestProfile: async (guestProfile) => {
    try {
      if (guestProfile) {
        await AsyncStorage.setItem('guest_profile', JSON.stringify(guestProfile));
      } else {
        await AsyncStorage.removeItem('guest_profile');
      }
      set({ guestProfile });
    } catch (e) {
      console.error('Error saving guest profile to AsyncStorage:', e);
    }
  },
  loadGuestProfile: async () => {
    set({ isLoadingGuest: true });
    try {
      const localProfileString = await AsyncStorage.getItem('guest_profile');
      if (localProfileString) {
        set({ guestProfile: JSON.parse(localProfileString) });
      }
    } catch (e) {
      console.error('Error loading guest profile from AsyncStorage:', e);
    } finally {
      set({ isLoadingGuest: false });
    }
  },
  clearGuestProfile: async () => {
    try {
      await AsyncStorage.removeItem('guest_profile');
      set({ guestProfile: null });
    } catch (e) {
      console.error('Error clearing guest profile from AsyncStorage:', e);
    }
  },
}));
