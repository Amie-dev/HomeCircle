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
  // console.log("DEBUG [usePassesHistory] Params passed:", { userId, role, societyId, towerId, towerName, flatName });

  return useQuery<VisitorPass[]>({
    queryKey: ['passesHistory', userId, role, societyId, towerId, towerName, flatName],
    queryFn: async () => {
      if (!userId) {
        // console.log("DEBUG [usePassesHistory] No userId provided, returning empty list.");
        return [];
      }
      
      let query = supabase.from('requestpasses').select('*');
      
      if (role === 'Resident' && societyId) {
        if (societyId !== "mock-soc-1") {
          // console.log(`DEBUG [usePassesHistory] Querying passes for society ID: ${societyId}`);
          query = query.eq('resident_details->>societyId', societyId);
        } else {
          // console.log("DEBUG [usePassesHistory] Mock mode (mock-soc-1) detected. Querying ALL passes from database.");
        }
      } else {
        // console.log(`DEBUG [usePassesHistory] Querying passes created by user ID: ${userId}`);
        // query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("DEBUG [usePassesHistory] Supabase query failed:", error);
        throw new Error(error.message || 'Failed to fetch visitor passes history');
      }

      // console.log(`DEBUG [usePassesHistory] Supabase returned ${data?.length || 0} passes.`);

      if (role === 'Resident' && societyId && flatName) {
        // console.log("DEBUG [usePassesHistory] Filtering passes in-memory for Resident...");
        const filtered = (data || []).filter(pass => {
          if (societyId === "mock-soc-1") {
            // console.log(`DEBUG [usePassesHistory] Mock mode bypass. Including pass ${pass.id} (Visitor: ${pass.visitor_name})`);
            return true; 
          }
          
          const matchesUser = pass.user_id === userId;
          
          const passTower = (pass.tower_no || '').trim().toLowerCase();
          const matchTower = 
            (towerId && passTower === towerId.trim().toLowerCase()) ||
            (towerName && passTower === towerName.trim().toLowerCase());
            
          const matchFlat = (pass.flat_no || '').trim().toLowerCase() === flatName.trim().toLowerCase();
          
          const keep = matchesUser || (matchTower && matchFlat);
          if (!keep) {
            // console.log(`DEBUG [usePassesHistory] Filtered out pass ${pass.id}. Matches:`, {
            //   matchesUser,
            //   matchTower,
            //   matchFlat,
            //   passTower,
            //   passFlat: pass.flat_no
            // });
          } else {
            // console.log(`DEBUG [usePassesHistory] Keeping pass ${pass.id} (Visitor: ${pass.visitor_name})`);
          }
          return keep;
        });
        // console.log(`DEBUG [usePassesHistory] Returning ${filtered.length} passes after filter.`);
        return filtered as VisitorPass[];
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
      if (passData.status === "Pending") {
        try {
          let resolvedFlatId = flatId;
          const societyId = passData.resident_details?.societyId;

          // If flatId is not provided, search using societyId, tower_no, and flat_no
          if (!resolvedFlatId && societyId && passData.tower_no && passData.flat_no) {
            const { data: towersData } = await supabase
              .from("towers")
              .select("id, name, tower_id")
              .eq("society_id", societyId);

            if (towersData) {
              const matchedTower = towersData.find(
                (t) =>
                  t.name?.toLowerCase() === passData.tower_no?.toLowerCase() ||
                  t.tower_id?.toLowerCase() === passData.tower_no?.toLowerCase() ||
                  t.name?.toLowerCase().includes(passData.tower_no?.toLowerCase())
              );

              if (matchedTower) {
                const { data: flatData } = await supabase
                  .from("flats")
                  .select("id")
                  .eq("tower_id", matchedTower.id)
                  .eq("flat_number", passData.flat_no)
                  .maybeSingle();

                if (flatData) {
                  resolvedFlatId = flatData.id;
                }
              }
            }
          }

          if (resolvedFlatId) {
            // Find flat details to get flat_admin_id
            const { data: flatData } = await supabase
              .from("flats")
              .select("flat_admin_id")
              .eq("id", resolvedFlatId)
              .maybeSingle();

            let targetUserId = flatData?.flat_admin_id;

            // If flat_admin_id is not set, fallback to finding any resident user of that flat in societymembers
            if (!targetUserId) {
              const { data: memberData } = await supabase
                .from("societymembers")
                .select("user_id")
                .eq("flat_id", resolvedFlatId)
                .maybeSingle();

              if (memberData) {
                targetUserId = memberData.user_id;
              }
            }

            if (targetUserId) {
              const { data: userData } = await supabase
                .from("users")
                .select("notification_token")
                .eq("id", targetUserId)
                .maybeSingle();

              let token = userData?.notification_token;

              // Fallback to guestusers if token is empty
              if (!token) {
                const { data: guestData } = await supabase
                  .from("guestusers")
                  .select("notification_token")
                  .eq("id", targetUserId)
                  .maybeSingle();

                if (guestData) {
                  token = guestData.notification_token;
                }
              }

              const notifTitle = "Visitor Approval Request 🔔";
              const notifBody = `${passData.visitor_name} is requesting access to your flat.`;

              if (token) {
                await sendPushNotification({
                  token: token,
                  title: notifTitle,
                  body: notifBody,
                  data: {
                    screen: "/resident/visitors",
                    url: "/resident/visitors",
                  },
                });
              }

              await supabase.from("push_notifications").insert({
                user_id: targetUserId,
                title: notifTitle,
                body: notifBody,
                screen: "/resident/visitors",
                status: "Sent",
              });
            }
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
