import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import { supabase } from "../../utils/supabase";
import { useCreateBooking } from "../hooks/useAmenityBookings";

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  amenity: {
    id: string;
    title: string;
    category: string;
    rating: string;
    location: string;
    status: string;
    image: string;
    maxCapacity: number;
    openingTime: string;
    closingTime: string;
  } | null;
  profile: {
    id: string;
    societyId?: string;
  } | null;
}

export function BookingModal({ visible, onClose, amenity, profile }: BookingModalProps) {
  const insets = useSafeAreaInsets();
  const createBookingMutation = useCreateBooking();

  const [bookingDate, setBookingDate] = useState<"Today" | "Tomorrow">("Today");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [numPeople, setNumPeople] = useState(1);
  const [flatMaxMembers, setFlatMaxMembers] = useState(6);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [dayBookings, setDayBookings] = useState<any[]>([]);
  const [isLoadingDayBookings, setIsLoadingDayBookings] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);

  const generateSlots = (openingTime: string, closingTime: string) => {
    const slots: { start: string; end: string }[] = [];
    const parseTimeToMinutes = (timeStr: string): number => {
      const parts = timeStr.split(":");
      const hours = parseInt(parts[0] || "0", 10);
      const minutes = parseInt(parts[1] || "0", 10);
      return hours * 60 + minutes;
    };

    const formatMinutesToTime = (totalMinutes: number): string => {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    };

    const startMinutes = parseTimeToMinutes(openingTime || "06:00");
    const endMinutes = parseTimeToMinutes(closingTime || "22:00");

    let current = startMinutes;
    while (current + 45 <= endMinutes) {
      slots.push({
        start: formatMinutesToTime(current),
        end: formatMinutesToTime(current + 45),
      });
      current += 45;
    }
    return slots;
  };

  const isSlotAvailable = (
    slotStart: string,
    slotEnd: string,
    bookings: any[],
    maxCapacity: number,
    bookingNumPeople: number
  ) => {
    if (bookingDate === "Today") {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeStr = `${currentHours.toString().padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")}`;

      if (slotStart < currentTimeStr) {
        return {
          available: false,
          remainingCapacity: 0,
          isPast: true,
        };
      }
    }

    let bookedPeople = 0;
    for (const b of bookings) {
      const bStart = b.start_time.substring(0, 5);
      const bEnd = b.end_time.substring(0, 5);
      if (bStart < slotEnd && bEnd > slotStart) {
        bookedPeople += b.num_people || 1;
      }
    }
    const remaining = maxCapacity - bookedPeople;
    return {
      available: remaining >= bookingNumPeople,
      remainingCapacity: remaining,
      isPast: false,
    };
  };

  const fetchFlatLimit = async () => {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from("userverifications")
        .select("flats(max_members)")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (data && (data as any).flats) {
        const limit = (data as any).flats.max_members;
        setFlatMaxMembers(limit || 6);
      }
    } catch (err) {
      console.warn("Failed to fetch flat members limit, defaulting to 6:", err);
    }
  };

  const fetchDayBookings = async (amenityTitle: string, targetDate: string) => {
    setIsLoadingDayBookings(true);
    try {
      const { data, error } = await supabase
        .from("amenity_bookings")
        .select("start_time, end_time, num_people")
        .eq("amenity_name", amenityTitle)
        .eq("booking_date", targetDate)
        .eq("status", "Confirmed");

      if (error) throw error;
      setDayBookings(data || []);
    } catch (err) {
      console.warn("Failed to fetch day bookings:", err);
    } finally {
      setIsLoadingDayBookings(false);
    }
  };

  useEffect(() => {
    if (!amenity || !visible) return;
    const todayDateStr = new Date().toISOString().split("T")[0];
    let finalBookingDate = todayDateStr;
    if (bookingDate === "Tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      finalBookingDate = tomorrow.toISOString().split("T")[0];
    }
    setSelectedSlotIndex(null);
    setStartTime("");
    setEndTime("");
    setShowAllSlots(false);
    fetchDayBookings(amenity.title, finalBookingDate);
  }, [amenity?.title, bookingDate, visible]);

  useEffect(() => {
    if (visible && profile) {
      setBookingDate("Today");
      setSelectedSlotIndex(null);
      setStartTime("");
      setEndTime("");
      setNumPeople(1);
      setShowAllSlots(false);
      fetchFlatLimit();
    }
  }, [visible, profile]);

  const handleSelectSlot = (index: number, start: string, end: string, available: boolean) => {
    if (!available) {
      Alert.alert("Slot Full", "This slot is full. Please try another slot.");
      return;
    }
    setSelectedSlotIndex(index);
    setStartTime(start);
    setEndTime(end);
  };

  const handlePeopleChange = (newCount: number) => {
    if (selectedSlotIndex !== null && amenity) {
      const slots = generateSlots(amenity.openingTime, amenity.closingTime);
      const slot = slots[selectedSlotIndex];
      const check = isSlotAvailable(slot.start, slot.end, dayBookings, amenity.maxCapacity || 20, newCount);
      if (!check.available) {
        Alert.alert("Capacity Exceeded", `The selected slot does not have enough remaining capacity for ${newCount} people.`);
        return;
      }
    }
    setNumPeople(newCount);
  };

  const executeBooking = () => {
    if (!profile || !amenity) return;

    if (!startTime || !endTime) {
      Alert.alert("Slot Required", "Please select an available time slot before confirming.");
      return;
    }

    const todayDateStr = new Date().toISOString().split("T")[0];
    let finalBookingDate = todayDateStr;
    if (bookingDate === "Tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      finalBookingDate = tomorrow.toISOString().split("T")[0];
    }

    createBookingMutation.mutate({
      user_id: profile.id,
      society_id: profile.societyId || "00000000-0000-0000-0000-000000000000",
      amenity_name: amenity.title,
      booking_date: finalBookingDate,
      start_time: startTime,
      end_time: endTime,
      num_people: numPeople,
    }, {
      onSuccess: () => {
        Alert.alert("Success", `${amenity.title} has been booked!`);
        onClose();
      },
      onError: (err: any) => {
        Alert.alert("Error booking", err.message || "Failed to book amenity.");
      }
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
        />
        
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.sheetHandle} />

          {amenity && (
            <View style={styles.sheetContent}>
              {/* Modal Title Bar */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Book Amenity</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={22} color={theme.colors.outline} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {/* Amenity Visual Header */}
                <View style={styles.modalVisualContainer}>
                  <Image source={{ uri: amenity.image }} style={styles.modalImage} />
                  <View style={styles.modalImageOverlay}>
                    <Text style={styles.modalAmenityName}>{amenity.title}</Text>
                    <Text style={styles.modalAmenityLocation}>{amenity.location}</Text>
                  </View>
                </View>

                <View style={styles.modalBody}>
                  {/* Date Selector */}
                  <Text style={styles.fieldLabel}>Select Date</Text>
                  <View style={styles.dateSelectorContainer}>
                    {["Today", "Tomorrow"].map((d) => {
                      const isSel = bookingDate === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          style={[styles.dateBtn, isSel && styles.dateBtnActive]}
                          onPress={() => setBookingDate(d as any)}
                        >
                          <Text style={[styles.dateBtnText, isSel && styles.dateBtnTextActive]}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Time Period Selector */}
                  <Text style={styles.fieldLabel}>Select Time Slot (45 mins)</Text>
                  {isLoadingDayBookings ? (
                    <ActivityIndicator size="small" color={theme.colors.secondary} style={{ padding: 12 }} />
                  ) : (
                    <View>
                      <View style={styles.slotsGrid}>
                        {(() => {
                          const allSlots = generateSlots(amenity.openingTime, amenity.closingTime);
                          return allSlots.map((slot, index) => {
                            const isVisible = showAllSlots || index < 4;
                            if (!isVisible) return null;

                            const check = isSlotAvailable(
                              slot.start,
                              slot.end,
                              dayBookings,
                              amenity.maxCapacity || 20,
                              numPeople
                            );
                            const isSelected = selectedSlotIndex === index;
                            const isBtnActive = check.available;
                            const isPast = (check as any).isPast;

                            return (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.slotChip,
                                  isSelected && styles.slotChipSelected,
                                  !isBtnActive && styles.slotChipDisabled,
                                ]}
                                onPress={() => handleSelectSlot(index, slot.start, slot.end, isBtnActive)}
                              >
                                <Text
                                  style={[
                                    styles.slotChipText,
                                    isSelected && styles.slotChipTextSelected,
                                    !isBtnActive && styles.slotChipTextDisabled,
                                  ]}
                                >
                                  {slot.start} - {slot.end}
                                </Text>
                                <Text
                                  style={[
                                    styles.slotCapacityText,
                                    isSelected && styles.slotCapacityTextSelected,
                                    !isBtnActive && styles.slotCapacityTextDisabled,
                                  ]}
                                >
                                  {isPast ? "Past Slot" : isBtnActive ? `${check.remainingCapacity} left` : "Full"}
                                </Text>
                              </TouchableOpacity>
                            );
                          });
                        })()}
                      </View>

                      {(() => {
                        const allSlots = generateSlots(amenity.openingTime, amenity.closingTime);
                        if (allSlots.length > 4) {
                          return (
                            <TouchableOpacity
                              style={styles.viewMoreBtn}
                              onPress={() => setShowAllSlots((prev) => !prev)}
                            >
                              <Text style={styles.viewMoreBtnText}>
                                {showAllSlots ? "Show Less" : `View More (+${allSlots.length - 4} slots)`}
                              </Text>
                              <MaterialIcons
                                name={showAllSlots ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                                size={18}
                                color={theme.colors.secondary}
                              />
                            </TouchableOpacity>
                          );
                        }
                        return null;
                      })()}
                    </View>
                  )}

                  {/* People Counter */}
                  <Text style={styles.fieldLabel}>Number of People</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => handlePeopleChange(Math.max(1, numPeople - 1))}
                    >
                      <MaterialIcons name="remove" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.counterValue}>{numPeople}</Text>
                    
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() => {
                        const maxLimit = Math.min(amenity.maxCapacity || 20, flatMaxMembers);
                        handlePeopleChange(Math.min(maxLimit, numPeople + 1));
                      }}
                    >
                      <MaterialIcons name="add" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.counterLimitLabel}>
                      (Max: {Math.min(amenity.maxCapacity || 20, flatMaxMembers)} pax)
                    </Text>
                  </View>
                  <Text style={styles.limitInfoText}>
                    Flat member limit: {flatMaxMembers} | Facility capacity: {amenity.maxCapacity || 20}
                  </Text>
                </View>
              </ScrollView>

              {/* Confirm Button (Sticky at Bottom) */}
              <TouchableOpacity
                style={styles.confirmBookingBtn}
                onPress={executeBooking}
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmBookingText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "85%",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(118, 119, 125, 0.4)",
    alignSelf: "center",
    marginTop: 8,
  },
  sheetContent: {
    paddingTop: 16,
    flexShrink: 1,
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  modalVisualContainer: {
    height: 180,
    position: "relative",
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    padding: 20,
    justifyContent: "flex-end",
  },
  modalAmenityName: {
    ...theme.typography.headlineLgMobile,
    color: "#ffffff",
    fontWeight: "700",
  },
  modalAmenityLocation: {
    ...theme.typography.bodyMd,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  modalBody: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  fieldLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  dateSelectorContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dateBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
  },
  dateBtnActive: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondary,
  },
  dateBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  dateBtnTextActive: {
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  slotChip: {
    width: "48%",
    flexGrow: 1,
    minWidth: "46%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  slotChipSelected: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondary,
  },
  slotChipDisabled: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderColor: "transparent",
    opacity: 0.5,
  },
  slotChipText: {
    ...theme.typography.bodyMd,
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
  slotChipTextSelected: {
    color: theme.colors.secondary,
  },
  slotChipTextDisabled: {
    color: theme.colors.outline,
  },
  slotCapacityText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  slotCapacityTextSelected: {
    color: theme.colors.secondary,
  },
  slotCapacityTextDisabled: {
    color: theme.colors.outline,
  },
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 8,
    gap: 4,
  },
  viewMoreBtnText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
  },
  counterValue: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  counterLimitLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
  },
  limitInfoText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 11,
  },
  confirmBookingBtn: {
    backgroundColor: theme.colors.secondary,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 20,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBookingText: {
    ...theme.typography.button,
    color: "#ffffff",
    fontWeight: "700",
  },
});
