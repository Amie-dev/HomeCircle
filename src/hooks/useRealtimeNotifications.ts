import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { supabase } from "../../utils/supabase";
import { useProfileStore } from "../store/useProfileStore";

export function useRealtimeNotifications() {
  const { profile } = useProfileStore();

  useEffect(() => {
    if (!profile?.id) return;

    // Set up local notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    console.log("SUBSCRIBING to push_notifications for user_id:", profile.id);

    // Subscribe to public.push_notifications for this authenticated user
    const channel = supabase
      .channel(`realtime-push-notifications-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "push_notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        async (payload) => {
          const { title, body } = payload.new;
          console.log("RECEIVED push notification insert:", payload.new);
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: title || "HomeCircle Notification 🔔",
                body: body || "New update in society.",
              },
              trigger: null,
            });
          } catch (err) {
            console.error("Failed to schedule local notification:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);
}
