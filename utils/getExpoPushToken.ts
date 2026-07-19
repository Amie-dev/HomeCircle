import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";

async function configureNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4979A6",
  });
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn("Push notifications require a physical device.");
      return null;
    }

    await configureNotificationChannel();

    let { status, canAskAgain } = await Notifications.getPermissionsAsync();

    if (status !== "granted") {
      if (!canAskAgain) {
        Alert.alert(
          "Notifications Disabled",
          "Notification permission has been permanently denied. Please enable notifications from your device settings.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );

        return null;
      }

      const permission = await Notifications.requestPermissionsAsync();
      status = permission.status;

      if (status !== "granted") {
        return null;
      }
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn("EAS Project ID not found.");
      return null;
    }

    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return data ?? null;
  } catch (error) {
    console.error("Failed to obtain Expo Push Token:", error);
    return null;
  }
}
