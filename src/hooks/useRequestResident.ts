import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabase';
import * as Notifications from 'expo-notifications';

export interface ResidentVerification {
  id: string;
  user_id: string;
  role: "Resident" | "Guard" | "Admin";
  society_id: string;
  tower_id: string;
  flat_id: string;
  is_verified: boolean;
  verified_by?: string | null;
  verify_user_id?: string | null;
  verified_at?: string | null;
  verification_details: {
    societyName: string;
    towerName: string;
    flatNumber: string;
  };
  created_at: string;
  // Joined fields from guestusers
  guestusers?: {
    full_name: string;
    email: string;
    phone: string;
  } | null;
}

export interface RequestResidentVerifyInput {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  societyId: string;
  towerId: string;
  flatId: string;
  societyName: string;
  towerName: string;
  flatNumber: string;
}

// 1. Hook to submit verification request (resident details)
export function useRequestResidentVerify() {
  return useMutation({
    mutationFn: async (input: RequestResidentVerifyInput) => {
      // 1. Insert Profile into guestusers
      const { error: insertUserErr } = await supabase
        .from("guestusers")
        .insert({
          id: input.userId,
          full_name: input.fullName,
          email: input.email,
          phone: input.phone,
          vehicle_number: null,
          notification_token: null,
        });

      // Handle duplicate user key gracefully if already exists
      if (insertUserErr && !insertUserErr.message.includes("duplicate") && insertUserErr.code !== "23505") {
        throw insertUserErr;
      }

      // 2. Insert verification request
      const { data, error: insertVerifyErr } = await supabase
        .from("userverifications")
        .insert({
          user_id: input.userId,
          role: "Resident",
          society_id: input.societyId,
          tower_id: input.towerId,
          flat_id: input.flatId,
          is_verified: false,
          verified_by: null,
          verify_user_id: null,
          verified_at: null,
          verification_details: {
            societyName: input.societyName,
            towerName: input.towerName,
            flatNumber: input.flatNumber,
          },
        })
        .select()
        .single();

      if (insertVerifyErr) throw insertVerifyErr;

      return data as ResidentVerification;
    },
  });
}

// 2. Hook to fetch all resident verifications (for Admin screen)
export function useResidentVerifications(societyId?: string) {
  return useQuery<ResidentVerification[]>({
    queryKey: ['residentVerifications', societyId],
    queryFn: async () => {
      let query = supabase
        .from("userverifications")
        .select(`
          id,
          user_id,
          role,
          society_id,
          tower_id,
          flat_id,
          is_verified,
          verification_details,
          created_at,
          guestusers (
            full_name,
            email,
            phone
          )
        `);
      
      if (societyId) {
        query = query.eq('society_id', societyId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || 'Failed to fetch resident verifications');
      }

      return data as any[];
    },
  });
}

// 3. Hook to update verification status (approve / pending / etc.)
export function useUpdateResidentVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      isVerified,
      previousStatus,
    }: {
      id: string;
      userId: string;
      isVerified: boolean;
      previousStatus: boolean;
    }) => {
      const { data, error } = await supabase
        .from("userverifications")
        .update({
          is_verified: isVerified,
          verified_at: isVerified ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update resident status');
      }

      // If status changed to Verified, send a push notification
      if (isVerified && !previousStatus) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Verification Approved 🏠",
              body: "Approved! You are now a flat member.",
              data: { residentId: userId },
            },
            trigger: null,
          });
        } catch (notifErr) {
          console.warn("Failed to send verification push notification:", notifErr);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residentVerifications'] });
    },
  });
}
