
import { useProfileStore } from "@/store/useProfileStore";
import { Redirect } from "expo-router";

export default function Index() {
  const { profile, isLoadingProfile } = useProfileStore();


   // Route to login if not logged in
    if (!profile) {
      return <Redirect href="/get-started" />;
    }
  
    // Role verification guard
    if (profile.role !== "Resident") {
      if (profile.role === "Admin") return <Redirect href="/admin" />;
      if (profile.role === "Guard") return <Redirect href="/guard" />;
      return <Redirect href="/request-pass" />;
    }

  return <Redirect href="/resident/(tabs)" />;
}