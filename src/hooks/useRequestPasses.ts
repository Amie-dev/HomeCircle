import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { sendPushNotification } from "../../utils/notificationService";
import { supabase } from "../../utils/supabase";
import {
  GuestProfile,
  useGuestProfileStore,
} from "../store/useGuestProfileStore";

export interface VisitorPass {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  designation: string;
  tower_no: string;
  flat_no: string;
  status: "Approved" | "Pending" | "Verified" | "Rejected" | "Expired";
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
  resident_id?: string | null;
}

// 1. Fetch History Query Hook
export function usePassesHistory(
  userId: string | undefined,
  role?: string,
  societyId?: string,
  towerId?: string,
  towerName?: string,
  flatName?: string,
  enabledFlag?: boolean,
) {
  // console.log("DEBUG [usePassesHistory] Params passed:", { userId, role, societyId, towerId, towerName, flatName });

  return useQuery<VisitorPass[]>({
    queryKey: [
      "passesHistory",
      userId,
      role,
      societyId,
      towerId,
      towerName,
      flatName,
    ],
    queryFn: async () => {
      if (!userId) {
        // console.log("DEBUG [usePassesHistory] No userId provided, returning empty list.");
        return [];
      }

      let query = supabase.from("requestpasses").select("*");

      if (role === "Resident" && societyId) {
        if (societyId !== "mock-soc-1") {
          // Resident queries all passes in their society from DB, then filters in-memory to support legacy data
          query = query.eq("resident_details->>societyId", societyId);
        }
      } else if (role === "Admin" && societyId) {
        if (societyId !== "mock-soc-1") {
          // Admin sees all passes in their society
          query = query.eq("resident_details->>societyId", societyId);
        }
      } else {
        // Fallback for guests/others (only show passes they created)
        if (userId) {
          query = query.eq("user_id", userId);
        }
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        // console.error("DEBUG [usePassesHistory] Supabase query failed:", error);
        throw new Error(
          error.message || "Failed to fetch visitor passes history",
        );
      }

      // console.log(`DEBUG [usePassesHistory] Supabase returned ${data?.length || 0} passes.`);

      if (role === "Resident" && societyId && flatName) {
        // console.log("DEBUG [usePassesHistory] Filtering passes in-memory for Resident...");
        const filtered = (data || []).filter((pass) => {
          if (societyId === "mock-soc-1") {
            // console.log(`DEBUG [usePassesHistory] Mock mode bypass. Including pass ${pass.id} (Visitor: ${pass.visitor_name})`);
            return true;
          }

          // 1. If resident_id matches the userId, keep it
          if (pass.resident_id === userId) {
            return true;
          }

          // 2. If resident_id is not set, use legacy tower/flat matching fallback
          if (!pass.resident_id) {
            const matchesUser = pass.user_id === userId;

            const passTower = (pass.tower_no || "").trim().toLowerCase();
            const matchTower =
              (towerId && passTower === towerId.trim().toLowerCase()) ||
              (towerName && passTower === towerName.trim().toLowerCase());

            const matchFlat =
              (pass.flat_no || "").trim().toLowerCase() ===
              flatName.trim().toLowerCase();

            return matchesUser || (matchTower && matchFlat);
          }

          return false;
        });
        // console.log(`DEBUG [usePassesHistory] Returning ${filtered.length} passes after filter.`);
        return filtered as VisitorPass[];
      }

      return data as VisitorPass[];
    },
    enabled: !!userId && (enabledFlag !== false),
    refetchInterval: (enabledFlag !== false) ? 4000 : false, // Poll every 4 seconds only if enabled/focused
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
      passData: Omit<VisitorPass, "id" | "created_at" | "status"> & {
        user_id: string;
        status: string;
      };
      flatId?: string;
    }) => {
      let finalPassData = { ...passData };
      let resolvedFlatId = flatId;
      const societyId = passData.resident_details?.societyId;

      // 1. Pre-resolve flat and matched resident details if status is Pending
      if (passData.status === "Pending") {
        try {
          // If flatId is not provided, search using societyId, tower_no, and flat_no
          if (
            !resolvedFlatId &&
            societyId &&
            passData.tower_no &&
            passData.flat_no
          ) {
            const { data: towersData } = await supabase
              .from("towers")
              .select("id, name, tower_id")
              .eq("society_id", societyId);

            if (towersData) {
              const matchedTower = towersData.find(
                (t) =>
                  t.name?.toLowerCase() === passData.tower_no?.toLowerCase() ||
                  t.tower_id?.toLowerCase() ===
                  passData.tower_no?.toLowerCase() ||
                  t.name
                    ?.toLowerCase()
                    .includes(passData.tower_no?.toLowerCase()),
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
            // Query flat details to get flat_admin_id
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
              // Set resident_id to targetUserId (flat_admin_id with fallback to member user_id)
              finalPassData.resident_id = targetUserId;

              const { data: userData } = await supabase
                .from("users")
                .select("full_name, email, phone")
                .eq("id", targetUserId)
                .maybeSingle();

              if (userData) {
                finalPassData.resident_details = {
                  ...finalPassData.resident_details,
                  fullName: userData.full_name,
                  email: userData.email,
                  phone: userData.phone,
                };
              }
              // console.log({
              //   finalPassData,
              // });
            }
          }
        } catch (resolveErr) {
          console.warn(
            "Failed to pre-resolve resident details in mutation Fn:",
            resolveErr,
          );
        }
      }

      // 2. Insert visitor pass in database
      const { data, error } = await supabase
        .from("requestpasses")
        .insert(finalPassData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || "Failed to generate visitor pass");
      }

      // 3. If it's a guest request (Pending), notify the flat admin/resident
      if (passData.status === "Pending" && resolvedFlatId) {
        try {
          // Find flat details to get flat_admin_id
          const { data: flatData } = await supabase
            .from("flats")
            .select("flat_admin_id")
            .eq("id", resolvedFlatId)
            .maybeSingle();

          let targetUserId = flatData?.flat_admin_id;
          // console.log("uerRequestPas.ts 234 line", { targetUserId });
          // If flat_admin_id is not set, fallback to finding any resident user of that flat in societymembers
          if (!targetUserId) {
            const { data: memberData, error } = await supabase
              .from("societymembers")
              .select("user_id")
              .eq("id", targetUserId)
              .maybeSingle();
            // console.log("useRequestPass.ts 273", { memberData });

            if (error) {
              console.log(error);
            }
            if (memberData) {
              targetUserId = memberData.user_id;
              // console.log("useRequestPass.ts 248", { memberData });
            }
          }

          if (targetUserId) {
            const { data: userData } = await supabase
              .from("users")
              .select("notification_token")
              .eq("id", targetUserId)
              .maybeSingle();

            let token = userData?.notification_token;
            // console.log("useRequestPass.ts 260", {
            //   token,
            // });
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
        } catch (notifErr) {
          console.warn(
            "Failed to notify resident of guest pass request in hook:",
            notifErr,
          );
        }
      }

      return data as VisitorPass;
    },
    onSuccess: (data) => {
      // Invalidate the history cache for this user
      queryClient.invalidateQueries({
        queryKey: ["passesHistory", data.resident_details.fullName],
      }); // Invalidating all or by user id
      queryClient.invalidateQueries({ queryKey: ["passesHistory"] });
    },
  });
}

// 3. Register Profile Mutation Hook
export function useRegisterProfile() {
  const setGuestProfile = useGuestProfileStore(
    (state) => state.setGuestProfile,
  );

  return useMutation({
    mutationFn: async (userData: {
      full_name: string;
      email: string;
      phone: string;
      vehicle_number: string | null;
      notification_token: string | undefined;
    }) => {
      const randomAvatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userData.full_name.trim() || Math.random().toString())}`;
      const payload = {
        ...userData,
        avatar_url: randomAvatarUrl,
      };

      console.log("useRegisterProfile: Attempting to insert guest user into guestusers table:", payload);
      const { data: newUser, error } = await supabase
        .from("guestusers")
        .insert(payload)
        .select()
        .single();

      if (error) {
        const isDuplicate =
          error.code === "23505" ||
          error.message.includes("unique") ||
          error.message.includes("duplicate");
        if (isDuplicate) {
          console.log("useRegisterProfile: Guest user already exists (duplicate email detected). Fetching existing profile...");
          // Fetch existing user with that email
          const { data: existingUser, error: fetchError } = await supabase
            .from("guestusers")
            .select("*")
            .eq("email", userData.email)
            .single();

          if (fetchError) {
            console.error("useRegisterProfile: Failed to fetch existing duplicate profile:", fetchError.message);
            throw new Error(
              fetchError.message || "Failed to fetch existing profile",
            );
          }

          console.log("useRegisterProfile: Cultivated existing duplicate user profile:", existingUser);

          // Update their notification token in guestusers if they don't have it, or if we have a new one
          if (userData.notification_token && existingUser.notification_token !== userData.notification_token) {
            console.log("useRegisterProfile: Inserting notification token into notifications table first:", userData.notification_token);
            const { error: notifErr } = await supabase
              .from("notifications")
              .insert({ token: userData.notification_token });

            if (notifErr && notifErr.code !== "23505") {
              console.warn("useRegisterProfile: Error inserting token to notifications table:", notifErr.message);
            }

            console.log("useRegisterProfile: Updating existing guest's notification token in guestusers table to:", userData.notification_token);
            const { error: updErr } = await supabase
              .from("guestusers")
              .update({ notification_token: userData.notification_token })
              .eq("id", existingUser.id);
            
            if (updErr) {
              console.error("useRegisterProfile: Error updating duplicate guest notification token:", updErr.message);
            } else {
              console.log("useRegisterProfile: Successfully updated duplicate guest notification token in database.");
              existingUser.notification_token = userData.notification_token;
            }
          }

          const guestProfile: GuestProfile = {
            id: existingUser.id,
            fullName: existingUser.full_name,
            email: existingUser.email,
            phone: existingUser.phone,
            vehicleNumber: existingUser.vehicle_number || undefined,
            token: existingUser.notification_token || undefined,
            joinedAt: existingUser.created_at,
            avatarUrl: existingUser.avatar_url || undefined,
          };
          console.log("useRegisterProfile: Returning resolved guest profile from duplicate handler:", guestProfile);
          return guestProfile;
        }

        console.error("useRegisterProfile: Error inserting new guest profile:", error.message);
        throw new Error(error.message || "Failed to register guest profile");
      }

      console.log("useRegisterProfile: Successfully inserted new guest user:", newUser);
      const activeToken = userData.notification_token || undefined;
      const guestProfile: GuestProfile = {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        vehicleNumber: newUser.vehicle_number || undefined,
        token: activeToken,
        joinedAt: newUser.created_at,
        avatarUrl: newUser.avatar_url || undefined,
      };

      return guestProfile;
    },
    onSuccess: async (profileData) => {
      // Save profile to Zustand guest store
      await setGuestProfile(profileData);
    },
  });
}

// 4. Update Pass Status Mutation Hook (Approve/Reject)
export function useUpdatePassStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      passId,
      status,
      visitorEmail,
    }: {
      passId: string;
      status: "Approved" | "Rejected";
      visitorEmail: string;
    }) => {
      const { error } = await supabase
        .from("requestpasses")
        .update({ status })
        .eq("id", passId);

      if (error) throw error;

      const title =
        status === "Approved" ? "Pass Approved 🎟️" : "Pass Rejected ❌";
      const body =
        status === "Approved"
          ? "Your request to visit has been approved by the resident."
          : "Your request to visit was rejected by the resident.";
      const screen = "/request-pass";

      // Fetch the guest's push token from guestusers table using email
      try {
        const { data: guestData } = await supabase
          .from("guestusers")
          .select("id, notification_token")
          .eq("email", visitorEmail)
          .maybeSingle();

        if (guestData) {
          if (guestData.notification_token) {
            await sendPushNotification({
              token: guestData.notification_token,
              title,
              body,
              data: {
                screen,
                url: screen,
              },
            });
          }

          // Notify the guest in push_notifications table
          await supabase.from("push_notifications").insert({
            user_id: guestData.id,
            title,
            body,
            screen,
            status: "Sent",
          });
        }
      } catch (pushErr) {
        console.warn("Failed to send push notification to guest:", pushErr);
      }
    },
    onSuccess: (_, variables) => {
      Alert.alert(
        "Success",
        `Visitor pass has been ${variables.status.toLowerCase()}.`,
      );
      queryClient.invalidateQueries({ queryKey: ["passesHistory"] });
      queryClient.invalidateQueries({ queryKey: ["activeInsideVisitors"] });
    },
    onError: (err: any) => {
      Alert.alert(
        "Error",
        err.message || "Failed to update visitor pass status.",
      );
    },
  });
}

// 5. Active Inside Visitors Query Hook
export function useActiveInsideVisitors(
  userId: string | undefined,
  societyId: string | undefined,
  enabledFlag?: boolean,
) {
  return useQuery<any[]>({
    queryKey: ["activeInsideVisitors", userId, societyId],
    queryFn: async () => {
      if (!userId || !societyId) return [];

      // Mock Mode Check
      if (societyId === "mock-soc-1") {
        return [
          {
            id: "mock-active-1",
            visitor_name: "Rahul Verma",
            designation: "Guest",
            verified_at: new Date().toISOString(),
          }
        ];
      }

      // 1. Fetch societymembers.id for this resident
      const { data: memberData, error: memberErr } = await supabase
        .from("societymembers")
        .select("id")
        .eq("user_id", userId)
        .eq("society_id", societyId)
        .maybeSingle();

      if (memberErr || !memberData) {
        return [];
      }

      const memberId = memberData.id;

      // 2. Fetch all visitor logs for this resident
      const { data: logs, error: logsErr } = await supabase
        .from("visitor_logs")
        .select(`
          id,
          action_type,
          created_at,
          gate_name,
          requestpasses (
            id,
            visitor_name,
            visitor_phone,
            visitor_email,
            designation,
            tower_no,
            flat_no,
            created_at
          )
        `)
        .eq("resident_id", memberId)
        .order("created_at", { ascending: false });

      if (logsErr || !logs) {
        return [];
      }

      // 3. Group by pass_id and filter for checked-in (Inside) visitors
      const latestLogMap: Record<string, any> = {};
      const activeVisitors: any[] = [];

      for (const log of logs) {
        const pass = log.requestpasses as any;
        if (!pass) continue;

        if (!(pass.id in latestLogMap)) {
          latestLogMap[pass.id] = log.action_type;

          if (log.action_type === "Check-in") {
            activeVisitors.push({
              id: pass.id,
              visitor_name: pass.visitor_name,
              designation: pass.designation,
              tower_no: pass.tower_no,
              flat_no: pass.flat_no,
              verified_at: log.created_at,
              created_at: pass.created_at,
              status: "Verified",
              visitor_phone: pass.visitor_phone,
              visitor_email: pass.visitor_email,
              gate: log.gate_name,
            });
          }
        }
      }

      return activeVisitors;
    },
    enabled: !!userId && !!societyId && (enabledFlag !== false),
    refetchInterval: (enabledFlag !== false) ? 4000 : false, // Poll every 4 seconds only if enabled/focused
  });
}
