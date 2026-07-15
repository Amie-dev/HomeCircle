import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabase';
import { useProfileStore, ResidentProfile } from '../store/useProfileStore';

export interface VisitorPass {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  designation: string;
  tower_no: string;
  flat_no: string;
  status: 'Approved' | 'Pending' | 'Verified' | 'Rejected' | 'Expired';
  expiry_hours: number;
  expiry_time: string;
  after_scan_qr_expiry: string;
  verified_at?: string | null;
  verified_by?: string | null;
  resident_details: {
    fullName: string;
    email: string;
    phone: string;
  };
  created_at: string;
}

// 1. Fetch History Query Hook
export function usePassesHistory(userId: string | undefined) {
  return useQuery<VisitorPass[]>({
    queryKey: ['passesHistory', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('requestpasses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || 'Failed to fetch visitor passes history');
      }

      return data as VisitorPass[];
    },
    enabled: !!userId,
  });
}

// 2. Create Pass Mutation Hook
export function useCreatePass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (passData: Omit<VisitorPass, 'id' | 'created_at' | 'status'> & { user_id: string; status: string }) => {
      const { data, error } = await supabase
        .from('requestpasses')
        .insert(passData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to generate visitor pass');
      }

      return data as VisitorPass;
    },
    onSuccess: (data) => {
      // Invalidate the history cache for this user
      queryClient.invalidateQueries({ queryKey: ['passesHistory', data.resident_details.fullName] }); // Invalidating all or by user id
      queryClient.invalidateQueries({ queryKey: ['passesHistory'] });
    },
  });
}

// 3. Register Profile Mutation Hook
export function useRegisterProfile() {
  const setProfile = useProfileStore((state) => state.setProfile);

  return useMutation({
    mutationFn: async (userData: {
      full_name: string;
      email: string;
      phone: string;
      vehicle_number: string | null;
      notification_token: string | undefined;
    }) => {
      const { data: newUser, error } = await supabase
        .from('guestusers')
        .insert(userData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to register guest profile');
      }

      const activeToken = userData.notification_token || undefined;
      const userProfile: ResidentProfile = {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        vehicleNumber: newUser.vehicle_number || undefined,
        token: activeToken,
      };

      return userProfile;
    },
    onSuccess: async (profileData) => {
      // Save profile to Zustand store
      await setProfile(profileData);
    },
  });
}
