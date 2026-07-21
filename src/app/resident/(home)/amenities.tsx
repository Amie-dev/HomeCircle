import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { useAmenityBookings, useAmenities } from "../../../hooks/useAmenityBookings";
import { BookingModal } from "../../../components/BookingModal";

export default function AmenityBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Booking Modal States
  const [selectedAmenity, setSelectedAmenity] = useState<any | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch bookings list for the respective resident
  const { data: bookingsList = [], isLoading } = useAmenityBookings(profile?.id);
  const { data: dbAmenities = [], isLoading: isLoadingAmenities } = useAmenities(profile?.societyId);

  const categories = ["All", "Sports", "Leisure", "Wellness", "Events"];

  const amenitiesList = dbAmenities.map((item) => {
    return {
      id: item.id,
      title: item.name,
      category: item.category || "Leisure",
      rating: item.rating?.toString() || "4.5",
      location: item.location || item.description || "Society Clubhouse",
      status: item.status || (item.booking_enabled ? "Available" : "Fully Booked"),
      image: item.image_urls?.[0] || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
      maxCapacity: item.max_capacity,
      openingTime: item.opening_time,
      closingTime: item.closing_time,
    };
  });

  const handleBookNow = (amenity: any) => {
    console.log("DEBUG: handleBookNow clicked, profile:", profile);
    setSelectedAmenity(amenity);
    setShowBookingModal(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Available":
        return { bg: "rgba(76, 175, 80, 0.15)", text: "#2e7d32" };
      case "Fully Booked":
        return { bg: "rgba(186, 26, 26, 0.15)", text: theme.colors.error };
      case "Closing Soon":
      default:
        return { bg: "rgba(245, 127, 23, 0.15)", text: "#b26a00" };
    }
  };

  const filteredAmenities = amenitiesList.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading || isLoadingAmenities) {
    return (
      <SafeAreaView style={[styles.outerContainer, { justifyContent: "center", alignItems: "center" }]} edges={["top"]}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.outerContainer} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Top App Bar Header */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Book Amenity</Text>
        </View>
        <TouchableOpacity style={styles.historyBtn} onPress={() => {
          router.push("/resident/(home)/booking-history" as any);
        }}>
          <MaterialIcons name="history" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search & Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchWrapper}>
            <MaterialIcons name="search" size={20} color={theme.colors.outline} style={styles.searchIcon} />
            <TextInput
              placeholder="Search amenities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.outline}
              style={styles.searchInput}
            />
          </View>

          {/* Category Chips Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Upcoming Booking Alert Banner */}
        {bookingsList.length > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertLeft}>
              <View style={styles.alertIconBox}>
                <MaterialIcons name="calendar-today" size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.alertSubLabel}>UPCOMING BOOKING</Text>
                <Text style={styles.alertTitle}>{bookingsList[bookingsList.length - 1].amenity_name}</Text>
                <Text style={styles.alertTime}>
                  {bookingsList[bookingsList.length - 1].booking_date}, {bookingsList[bookingsList.length - 1].start_time} - {bookingsList[bookingsList.length - 1].end_time}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.secondary} />
          </View>
        )}

        {/* Explore Facilities Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Facilities</Text>
          <TouchableOpacity onPress={() => Alert.alert("Facilities", "Viewing all facilities available in HomeCircle.")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Facilities Bento List */}
        <View style={styles.facilitiesGrid}>
          {filteredAmenities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={48} color={theme.colors.outline} style={{ marginBottom: 4 }} />
              <Text style={styles.emptyText}>No amenities found matching your search or filters.</Text>
            </View>
          ) : (
            filteredAmenities.map((item) => {
              const statusStyle = getStatusStyle(item.status);
              const isBooked = item.status === "Fully Booked";

              return (
                <View key={item.id} style={styles.facilityCard}>
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.image }} style={styles.facilityImage} />
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.facilityDetails}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.facilityName}>{item.title}</Text>
                      {item.rating && (
                        <View style={styles.ratingRow}>
                          <MaterialIcons name="star" size={14} color={theme.colors.onSurfaceVariant} />
                          <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.locationRow}>
                      <MaterialIcons name="location-on" size={14} color={theme.colors.outline} />
                      <Text style={styles.locationText}>{item.location}</Text>
                    </View>

                    {isBooked ? (
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => Alert.alert(`${item.title} Schedule`, "Current slots are filled. Checking next opening slots...")}
                      >
                        <Text style={styles.secondaryBtnText}>View Schedule</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => handleBookNow(item)}
                      >
                        <Text style={styles.primaryBtnText}>Book Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Booking Rules Card */}
        <View style={styles.rulesCard}>
          <View style={styles.rulesContent}>
            <Text style={styles.rulesTitle}>Booking Rules</Text>
            <Text style={styles.rulesText}>Learn about guest policies and cancellation windows for amenities.</Text>
            <TouchableOpacity style={styles.rulesBtn} onPress={() => Alert.alert("Booking Rules", "Cancellation Policy:\n1. Bookings cancelled 24 hours prior will receive a full refund.\n2. Up to 3 active bookings allowed per unit.")}>
              <Text style={styles.rulesBtnText}>Read More</Text>
            </TouchableOpacity>
          </View>
          <MaterialIcons name="info" size={96} color="rgba(255,255,255,0.05)" style={styles.bgIcon} />
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/request-pass" as any)}>
        <MaterialIcons name="qr-code-2" size={28} color={theme.colors.secondary} />
      </TouchableOpacity>

      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        amenity={selectedAmenity}
        profile={profile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topAppBar: {
    height: 56,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.2)",
  },
  topAppBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  appBarTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  historyBtn: {
    padding: 4,
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: theme.spacing.lg,
    paddingBottom: 100,
  },
  searchSection: {
    marginTop: 8,
    gap: 12,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 12,
    height: 48,
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: 14,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 44,
    paddingRight: 16,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  chipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  alertBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(134,242,228,0.15)",
    borderWidth: 1,
    borderColor: "rgba(134,242,228,0.3)",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  alertSubLabel: {
    ...theme.typography.labelMd,
    fontSize: 9,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  alertTitle: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  alertTime: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  viewAllText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
  },
  facilitiesGrid: {
    gap: 20,
  },
  facilityCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.2)",
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.02)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  imageContainer: {
    height: 160,
    position: "relative",
  },
  facilityImage: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  facilityDetails: {
    padding: theme.spacing.md,
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  facilityName: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
    fontSize: 12,
  },
  primaryBtn: {
    backgroundColor: theme.colors.secondary,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
  },
  rulesCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    padding: 24,
    marginTop: 32,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  rulesContent: {
    zIndex: 2,
    gap: 8,
  },
  rulesTitle: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "700",
  },
  rulesText: {
    ...theme.typography.bodyMd,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
    maxWidth: 200,
  },
  rulesBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  rulesBtnText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontSize: 12,
  },
  bgIcon: {
    position: "absolute",
    right: -16,
    bottom: -16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.secondaryContainer,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.secondaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 40,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.2)",
    gap: 12,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
    textAlign: "center",
  },
});
