import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';

export interface ResidentProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleNumber?: string;
  token?: string;
  role?: 'Resident' | 'Guard' | 'Admin';
  isVerified?: boolean;
  societyId?: string;
  societyName?: string;
  towerName?: string;
  flatName?: string;
}

interface ProfileState {
  profile: ResidentProfile | null;
  isLoadingProfile: boolean;
  signupData: any | null;
  setProfile: (profile: ResidentProfile | null) => Promise<void>;
  loadProfile: () => Promise<void>;
  clearProfile: () => Promise<void>;
  setSignupData: (data: any | null) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoadingProfile: true,
  signupData: null,
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
      // 1. Quick load from AsyncStorage to get instant UI state
      const localProfileString = await AsyncStorage.getItem('user_profile');
      if (localProfileString) {
        set({ profile: JSON.parse(localProfileString) });
      }

      // 2. Fetch Supabase session to check if authenticated and synchronize status
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;

        // Fetch user basic profile
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (profileData) {
          // Fetch verification status
          const { data: verifyData } = await supabase
            .from("userverifications")
            .select(`
              role,
              is_verified,
              society_id,
              societies ( name ),
              towers ( name ),
              flats ( flat_number )
            `)
            .eq("user_id", userId)
            .maybeSingle();

          let role = (verifyData?.role || profileData.role) as 'Resident' | 'Guard' | 'Admin' | undefined;
          let isVerified = verifyData?.is_verified || false;
          let societyId = verifyData?.society_id || undefined;
          let societyName = (verifyData?.societies as any)?.name || undefined;
          let towerName = (verifyData?.towers as any)?.name || undefined;
          let flatName = (verifyData?.flats as any)?.flat_number || undefined;

          const syncedProfile: ResidentProfile = {
            id: userId,
            fullName: profileData.full_name,
            email: profileData.email,
            phone: profileData.phone,
            role,
            isVerified,
            societyId,
            societyName,
            towerName,
            flatName,
          };

          // Save synced profile to AsyncStorage and Zustand state
          await AsyncStorage.setItem('user_profile', JSON.stringify(syncedProfile));
          set({ profile: syncedProfile });
        }
      } else if (!localProfileString) {
        // No session and no local cache, clear profile
        set({ profile: null });
      }
    } catch (e) {
      console.error('Error syncing profile with Supabase:', e);
    } finally {
      set({ isLoadingProfile: false });
    }
  },
  clearProfile: async () => {
    try {
      await AsyncStorage.removeItem('user_profile');
      await supabase.auth.signOut();
      set({ profile: null, signupData: null });
    } catch (e) {
      console.error('Error clearing profile from AsyncStorage:', e);
    }
  },
  setSignupData: (data) => set({ signupData: data }),
}));
