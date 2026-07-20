import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { useAmenityBookings, useCreateBooking, AmenityBooking } from "../../../hooks/useAmenityBookings";
import { supabase } from "../../../../utils/supabase";

const amenityImages: Record<string, string> = {
  "Badminton Court 1": "https://lh3.googleusercontent.com/aida-public/AB6AXuBNBTlyZufV2PSP544pUl4t_eyxGZRCX06P1WhFmFAtpmI136l8NWLo5qBJJtlj9k3tVJ5GT0Xobf3gNTHUvZ9bT6xJAXwaC--fsTz1VVzON3uWUqrNp8pVusaCNyg_3ofLTc8ptbf5slLMxmnBYOu7-fcyGmey-ruNI3sQL9PbnMm0c9tUw0ApGgaprE_EXLTxU53VYUlgmQ77-USepeK6uO1aQo-SZFky10djFL1WvbqzwkKeFXu36w",
  "Infinity Pool": "https://lh3.googleusercontent.com/aida-public/AB6AXuDns_XlCAtNQm0RhEVC2VkqGMoL9y3yGqEsT9XkaEAZh8SA1dOP-tH7WJ4MEf4A1MriZvCdhUnQ-Xwc6Xc0R4HYzwMXxs5_PSYp5E22yrVYsPLEn1vrO4GTnYJ60Pfq7b9ITd1s2nsl7lRV46G5XALzy2L_W4bZtMElAzxXFPqZH5cZHEpiz5dTylUZ9T8fDSI92DuP4ag0kA7aBNBSMnz_k-uSEGz8rYv7Nkcz6OUsCIGTzxvL8RZhnQ",
  "Community Hall": "https://lh3.googleusercontent.com/aida-public/AB6AXuDgLK2YM9Up73pQVCxgLYHclzmFZaMXB6Fq9kkRUf9fo0lUg-Di_FIoRHeCz48dFiYcM8VLIuJepeIACMqzXKr1vRqd8pQBq2iG3bEOVTqD9kZyPBof--U_8_utzBJJGEWaEq_tzNeuondS_d6fdQXZ-xzVVh-uBWPudoSPZfMnBrsvzROod2sN7wzW-nnSgrh5XVvGSenIMmVCGTB97iHDzVf2lzIG3DWOcYiZIuTyvNigYl7dQgs4ng",
  "High-Performance Gym": "https://lh3.googleusercontent.com/aida-public/AB6AXuCS0iqJaGhRdXnMQECzb5Kzm1DqSPUfp38EAYzbWfARzmWCAoVEoUqb81P1cKfE6NaR_izcrwgZA2dabvsNaIeGyLc8S-aTEjKLFh7B4Arc8RctBX3xn6rWxzeJ-nrmlPoEZ4assCsHBwGbO_jJFxOXCDyCrQIhlIsqMzF2RyE31zoo46HI2rws2f8ubdlHT5K_dh5MtQDIpksqhKUfFa4ssV5MbJObJJkbB_AOvTVApE0HOJzWbhF7sA"
};

const getAmenityImage = (name: string) => {
  return amenityImages[name] || "https://lh3.googleusercontent.com/aida-public/AB6AXuDgLK2YM9Up73pQVCxgLYHclzmFZaMXB6Fq9kkRUf9fo0lUg-Di_FIoRHeCz48dFiYcM8VLIuJepeIACMqzXKr1vRqd8pQBq2iG3bEOVTqD9kZyPBof--U_8_utzBJJGEWaEq_tzNeuondS_d6fdQXZ-xzVVh-uBWPudoSPZfMnBrsvzROod2sN7wzW-nnSgrh5XVvGSenIMmVCGTB97iHDzVf2lzIG3DWOcYiZIuTyvNigYl7dQgs4ng";
};

export default function BookingHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const { data: bookingsList = [], isLoading, refetch } = useAmenityBookings(profile?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AmenityBooking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenDetail = (booking: AmenityBooking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      [
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              const { error } = await supabase
                .from("amenity_bookings")
                .update({ status: "Cancelled" })
                .eq("id", bookingId);

              if (error) throw error;
              
              Alert.alert("Success", "Booking has been cancelled.");
              setShowDetailModal(false);
              refetch();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to cancel booking.");
            } finally {
              setCancelling(false);
            }
          },
        },
        { text: "Keep Booking", style: "cancel" },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return { bg: "rgba(0, 106, 97, 0.1)", text: theme.colors.secondary };
      case "Cancelled":
        return { bg: "rgba(186, 26, 26, 0.1)", text: theme.colors.error };
      default:
        return { bg: "rgba(118, 119, 125, 0.1)", text: theme.colors.outline };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={[styles.outerContainer, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Top App Bar Header */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Booking History</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.secondary]}
              tintColor={theme.colors.secondary}
            />
          }
        >
          {bookingsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={64} color={theme.colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No Bookings Found</Text>
              <Text style={styles.emptySubtitle}>
                You haven't booked any amenities yet. Head back to book sports facilities or halls.
              </Text>
              <TouchableOpacity
                style={styles.backToBookBtn}
                onPress={() => router.back()}
              >
                <Text style={styles.backToBookBtnText}>Browse Amenities</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {bookingsList.map((item) => {
                const statusColor = getStatusColor(item.status);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.bookingCard}
                    activeOpacity={0.8}
                    onPress={() => handleOpenDetail(item)}
                  >
                    <Image
                      source={{ uri: getAmenityImage(item.amenity_name) }}
                      style={styles.cardImage}
                    />
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.amenityName} numberOfLines={1}>
                          {item.amenity_name}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                          <Text style={[styles.statusText, { color: statusColor.text }]}>
                            {item.status}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.metaRow}>
                        <MaterialIcons name="event" size={16} color={theme.colors.outline} />
                        <Text style={styles.metaText}>{formatDate(item.booking_date)}</Text>
                      </View>
                      
                      <View style={styles.metaRow}>
                        <MaterialIcons name="schedule" size={16} color={theme.colors.outline} />
                        <Text style={styles.metaText}>
                          {item.start_time} - {item.end_time}
                        </Text>
                      </View>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={theme.colors.outlineVariant}
                      style={styles.chevron}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Booking Details Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowDetailModal(false)}
            activeOpacity={1}
          />
          
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetHandle} />

            {selectedBooking && (
              <View style={styles.sheetContent}>
                {/* Modal Title Bar */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Booking Details</Text>
                  <TouchableOpacity
                    onPress={() => setShowDetailModal(false)}
                    style={styles.closeBtn}
                  >
                    <MaterialIcons name="close" size={22} color={theme.colors.outline} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Amenity Visual Header */}
                  <View style={styles.modalVisualContainer}>
                    <Image
                      source={{ uri: getAmenityImage(selectedBooking.amenity_name) }}
                      style={styles.modalImage}
                    />
                    <View style={styles.modalImageOverlay}>
                      <Text style={styles.modalAmenityName}>{selectedBooking.amenity_name}</Text>
                    </View>
                  </View>

                  {/* Booking ID Details */}
                  <View style={styles.detailsGroup}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reference ID</Text>
                      <Text style={styles.detailValue} selectable={true}>
                        HC-AM-{selectedBooking.id.substring(0, 8).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.detailDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Booking Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(selectedBooking.booking_date)}
                      </Text>
                    </View>
                    <View style={styles.detailDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Slot Timings</Text>
                      <Text style={styles.detailValue}>
                        {selectedBooking.start_time} - {selectedBooking.end_time}
                      </Text>
                    </View>
                    <View style={styles.detailDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Booking Status</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(selectedBooking.status).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(selectedBooking.status).text },
                          ]}
                        >
                          {selectedBooking.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Entry Verification Pass */}
                  {selectedBooking.status === "Confirmed" && (
                    <View style={styles.passContainer}>
                      <MaterialIcons name="qr-code-2" size={80} color={theme.colors.primary} />
                      <Text style={styles.passText}>
                        Present this verification pass to the security guard at the facility gate for scanning.
                      </Text>
                    </View>
                  )}

                  {/* Actions */}
                  {selectedBooking.status === "Confirmed" && (
                    <TouchableOpacity
                      style={styles.cancelBookingBtn}
                      disabled={cancelling}
                      onPress={() => handleCancelBooking(selectedBooking.id)}
                    >
                      {cancelling ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <MaterialIcons name="cancel" size={20} color="#ffffff" />
                          <Text style={styles.cancelBookingText}>Cancel Booking</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  topAppBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198,198,205,0.25)",
    zIndex: 10,
  },
  topAppBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    padding: 4,
    borderRadius: 20,
  },
  appBarTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: theme.spacing.lg,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.onSurface,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  backToBookBtn: {
    marginTop: 16,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.rounded.default,
  },
  backToBookBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
  },
  listContainer: {
    gap: 12,
  },
  bookingCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198,198,205,0.3)",
    overflow: "hidden",
    alignItems: "center",
    paddingRight: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: 90,
    height: 90,
    resizeMode: "cover",
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  amenityName: {
    ...theme.typography.headlineMd,
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.onSurface,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    ...theme.typography.bodyMd,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  chevron: {
    alignSelf: "center",
  },

  // Modal Detail styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: theme.spacing.containerMarginMobile,
    maxHeight: "92%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  sheetContent: {
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198,198,205,0.2)",
    marginBottom: 8,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  modalVisualContainer: {
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginBottom: 16,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  modalImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalAmenityName: {
    ...theme.typography.headlineLgMobile,
    color: "#ffffff",
    fontWeight: "700",
  },
  detailsGroup: {
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    paddingVertical: 6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  detailValue: {
    ...theme.typography.headlineMd,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
  detailDivider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    marginHorizontal: 16,
    opacity: 0.5,
  },
  passContainer: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.secondary,
    gap: 8,
    marginBottom: 20,
  },
  passText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
  cancelBookingBtn: {
    backgroundColor: theme.colors.error,
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cancelBookingText: {
    ...theme.typography.button,
    color: "#ffffff",
    fontSize: 15,
  },
});
