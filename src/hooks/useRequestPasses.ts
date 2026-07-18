import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabase';
import { sendPushNotification } from '../../utils/notificationService';
import { useProfileStore, ResidentProfile } from '../store/useProfileStore';
import { useGuestProfileStore, GuestProfile } from '../store/useGuestProfileStore';

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
    societyId?: string;
    societyName?: string;
    [key: string]: any;
  };
  created_at: string;
  user_id: string;
}

// 1. Fetch History Query Hook
export function usePassesHistory(
  userId: string | undefined,
  role?: string,
  societyId?: string,
  towerId?: string,
  towerName?: string,
  flatName?: string
) {
  return useQuery<VisitorPass[]>({
    queryKey: ['passesHistory', userId, role, societyId, towerId, towerName, flatName],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase.from('requestpasses').select('*');
      
      if (role === 'Resident' && societyId && flatName) {
        const towerFilter = towerId && towerName
          ? `or(tower_no.eq."${towerId}",tower_no.eq."${towerName}")`
          : towerId
            ? `tower_no.eq."${towerId}"`
            : `tower_no.eq."${towerName}"`;

        query = query.or(`user_id.eq.${userId},and(${towerFilter},flat_no.eq."${flatName}")`)
          .eq('resident_details->>societyId', societyId);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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
    mutationFn: async ({
      passData,
      flatId,
    }: {
      passData: Omit<VisitorPass, 'id' | 'created_at' | 'status'> & { user_id: string; status: string };
      flatId?: string;
    }) => {
      const { data, error } = await supabase
        .from('requestpasses')
        .insert(passData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to generate visitor pass');
      }

      // If it's a guest request (Pending), notify the flat admin/resident
      if (passData.status === "Pending" && flatId) {
        try {
          const { data: flatData } = await supabase
            .from("flats")
            .select("flat_admin_id")
            .eq("id", flatId)
            .maybeSingle();

          if (flatData?.flat_admin_id) {
            const { data: userData } = await supabase
              .from("users")
              .select("notification_token")
              .eq("id", flatData.flat_admin_id)
              .maybeSingle();

            const notifTitle = "Visitor Approval Request 🔔";
            const notifBody = `${passData.visitor_name} is requesting access to your flat.`;

            if (userData?.notification_token) {
              await sendPushNotification({
                token: userData.notification_token,
                title: notifTitle,
                body: notifBody,
                data: {
                  screen: "/resident/visitors",
                  url: "/resident/visitors",
                },
              });
            }

            await supabase.from("push_notifications").insert({
              user_id: flatData.flat_admin_id,
              title: notifTitle,
              body: notifBody,
              screen: "/resident/visitors",
              status: "Sent",
            });
          }
        } catch (notifErr) {
          console.warn("Failed to notify resident of guest pass request in hook:", notifErr);
        }
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
  const setGuestProfile = useGuestProfileStore((state) => state.setGuestProfile);

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
        const isDuplicate = error.code === '23505' || 
                            error.message.includes('unique') || 
                            error.message.includes('duplicate');
        if (isDuplicate) {
          // Fetch existing user with that email
          const { data: existingUser, error: fetchError } = await supabase
            .from('guestusers')
            .select('*')
            .eq('email', userData.email)
            .single();

          if (fetchError) {
            throw new Error(fetchError.message || 'Failed to fetch existing profile');
          }

          const guestProfile: GuestProfile = {
            id: existingUser.id,
            fullName: existingUser.full_name,
            email: existingUser.email,
            phone: existingUser.phone,
            vehicleNumber: existingUser.vehicle_number || undefined,
            token: userData.notification_token || undefined,
            joinedAt: existingUser.created_at,
          };
          return guestProfile;
        }

        throw new Error(error.message || 'Failed to register guest profile');
      }

      const activeToken = userData.notification_token || undefined;
      const guestProfile: GuestProfile = {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        vehicleNumber: newUser.vehicle_number || undefined,
        token: activeToken,
        joinedAt: newUser.created_at,
      };

      return guestProfile;
    },
    onSuccess: async (profileData) => {
      // Save profile to Zustand guest store
      await setGuestProfile(profileData);
    },
  });
}
