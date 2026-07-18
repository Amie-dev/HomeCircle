import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type SendNotificationParams = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
};

export async function sendPushNotification({
  token,
  title,
  body,
  data = {},
  sound = "default",
}: SendNotificationParams) {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(result));
    }

    return result;
  } catch (error) {
    console.error("Failed to send notification:", error);
    throw error;
  }
}