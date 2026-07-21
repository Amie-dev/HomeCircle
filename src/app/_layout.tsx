import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function useNotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === "string") {
        router.push(url as any);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

function MainAppContent() {
  // Activate global realtime push notifications listener
  useRealtimeNotifications();

  // Activate notification click/redirect listener
  useNotificationObserver();
  // const { profile, isLoadingProfile, loadProfile } = useProfileStore();
  // const segments = useSegments();

  // // useEffect(() => {
  // //   loadProfile();
  // // }, []);

  // // While profile is being loaded from storage, show a spinner
  // if (isLoadingProfile) {
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         justifyContent: "center",
  //         alignItems: "center",
  //         backgroundColor: theme.colors.background,
  //       }}
  //     >
  //       <ActivityIndicator size="large" color={theme.colors.secondary} />
  //     </View>
  //   );
  // }

  // // If the user is already logged in, redirect away from auth screens
  // if (profile) {
  //   if (profile.role === "Guard") return <Redirect href="/guard" />;
  //   if (profile.role === "Admin") return <Redirect href="/admin" />;
  //   if (profile.role === "Resident") return <Redirect href="/resident" />;
  // }

  // // // If the user is not logged in, redirect to auth screens
  // // if (!profile) {
  // //   const inAuthGroup = segments[0] === "(auth)" || segments.length === 0;
  // //   if (!inAuthGroup) {
  // //     return <Redirect href="/" />;
  // //   }
  // // }
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {


  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <MainAppContent />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
