import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing! Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: Platform.OS !== "web",
    persistSession: Platform.OS !== "web",
    detectSessionInUrl: Platform.OS === "web",
  },
});