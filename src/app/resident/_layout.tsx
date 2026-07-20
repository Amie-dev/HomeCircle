import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";



export default function RootLayout() {
  return (
    <SafeAreaProvider>
      

        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(home)" />
            <Stack.Screen name="(setting)" />
          

            {/* <Stack.Screen
              name="files/[id]/index"
              options={{
                headerShown: true,
                title: "File Details",
              }}
            /> */}
            {/* <Stack.Screen
              name="files/[id]/edit"
              options={{
                headerShown: true,
                title: "File Edit",
              }}
            /> */}
            {/* <Stack.Screen
              name="folders/[id]/index"
              options={{
                headerShown: true,
                title: "Folder ",
              }}
            /> */}
          </Stack>
        </View>
   
    </SafeAreaProvider>
  );
}