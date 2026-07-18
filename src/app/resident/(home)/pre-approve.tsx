import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Image, Switch, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { useCreatePass } from "../../../hooks/useRequestPasses";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PreApproveGuestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
  const createPass = useCreatePass();

  // Form States
  const [guestName, setGuestName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [category, setCategory] = useState<"Guest" | "Family" | "Delivery" | "Service">("Guest");
  const [purpose, setPurpose] = useState("");
  const [expectedArrival, setExpectedArrival] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [frequent, setFrequent] = useState(false);

  // Modal State
  const [showQRModal, setShowQRModal] = useState(false);

  const categories: Array<"Guest" | "Family" | "Delivery" | "Service"> = [
    "Guest",
    "Family",
    "Delivery",
    "Service",
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Guest":
        return "group";
      case "Family":
        return "people-alt";
      case "Delivery":
        return "local-shipping";
      case "Service":
        return "construction";
      default:
        return "person";
    }
  };

  const handleGeneratePass = () => {
    if (!guestName.trim()) {
      Alert.alert("Error", "Please enter the guest's name.");
      return;
    }
    if (!mobileNumber.trim()) {
      Alert.alert("Error", "Please enter a mobile number.");
      return;
    }

    if (!profile) {
      // Demo fallback in case profile store is empty
      setShowQRModal(true);
      return;
    }

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24); // Default to 24h validity

    createPass.mutate({
      passData: {
        user_id: profile.id,
        visitor_name: guestName,
        visitor_email: "",
        visitor_phone: mobileNumber,
        designation: category,
        tower_no: profile.towerName || "Block C",
        flat_no: profile.flatName || "402",
        status: "Approved",
        expiry_hours: 24,
        expiry_time: expiryDate.toISOString(),
        after_scan_qr_expiry: "Once",
        resident_details: {
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          societyId: profile.societyId,
          societyName: "HomeCircle Society",
          purpose: purpose.trim(),
          vehicleNumber: vehicleNumber.trim(),
          expectedArrival: expectedArrival.trim(),
          isFrequent: frequent,
        },
      },
      flatId: undefined,
    }, {
      onSuccess: () => {
        setShowQRModal(true);
      },
      onError: (err: any) => {
        Alert.alert("Error requesting pass", err.message || "Please try again.");
      }
    });
  };

  const handleDone = () => {
    setShowQRModal(false);
    // Reset Form
    setGuestName("");
    setMobileNumber("");
    setPurpose("");
    setExpectedArrival("");
    setVehicleNumber("");
    setFrequent(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.outerContainer}>
        <StatusBar style="light" />

        {/* Top App Bar Header */}
        <View style={[styles.topAppBar, { paddingTop: insets.top }]}>
          <View style={styles.topAppBarLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.appBarTitle}>Pre-approve Guest</Text>
          </View>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: profile ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=0D9488&color=fff` : "https://ui-avatars.com/api/?name=Guest" }}
              style={styles.avatar}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Hero Complex Entrance Image */}
          <View style={styles.heroCard}>
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFuEfBOOy1mmVlRX9zS6vKg5GtW-_AfREzvUguRiLl6NstUf8WyAQzmchVB-o6xcAJbemxzhX-WC6eTlZPBEgf92eHpU23qUmnM0ypoBtNRRlHopXnn52814y8wGD7ngrLzZ3mLBrkcDgZ1ugGUctXeHRwEDg1cBqOQmxq3_iPQ0b4graHhxxuSZjWI3UzQiJGtrd-hHDgVhN-SyNtziGTr3hE9Ya098BoIYj9h3hGeEK4U2uPCMOA1w" }}
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Quick Entry for Visitors</Text>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Guest Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Guest Name</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. John Doe"
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholderTextColor={theme.colors.outline}
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="phone-android" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  placeholder="+1 (555) 000-0000"
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholderTextColor={theme.colors.outline}
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Visitor Category Selector Grid */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Visitor Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <MaterialIcons
                        name={getCategoryIcon(cat)}
                        size={20}
                        color={isSelected ? theme.colors.secondary : theme.colors.onSurfaceVariant}
                      />
                      <Text style={[styles.categoryBtnText, isSelected && styles.categoryBtnTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Purpose of Visit */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purpose of Visit</Text>
              <TextInput
                placeholder="e.g. Dinner Party"
                value={purpose}
                onChangeText={setPurpose}
                placeholderTextColor={theme.colors.outline}
                style={[styles.textInputFlat]}
              />
            </View>

            {/* Expected Arrival */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expected Arrival</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="e.g. Today, 7:00 PM"
                  value={expectedArrival}
                  onChangeText={setExpectedArrival}
                  placeholderTextColor={theme.colors.outline}
                  style={[styles.textInput, { paddingLeft: 16 }]}
                />
                <MaterialIcons name="calendar-today" size={18} color={theme.colors.outline} style={styles.rightInputIcon} />
              </View>
            </View>

            {/* Vehicle Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Number (Optional)</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="directions-car" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  placeholder="ABC-1234"
                  autoCapitalize="characters"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  placeholderTextColor={theme.colors.outline}
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Frequent Visitor Toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Mark as Frequent Visitor</Text>
                <Text style={styles.toggleDesc}>Save details for future pre-approvals</Text>
              </View>
              <Switch
                value={frequent}
                onValueChange={setFrequent}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Security Note Banner */}
          <View style={styles.infoBanner}>
            <MaterialIcons name="info" size={20} color={theme.colors.secondary} />
            <Text style={styles.infoText}>
              The guest will receive a secure QR pass via SMS/WhatsApp. Security will scan this for seamless entry.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.generateBtn}
            disabled={createPass.isPending}
            onPress={handleGeneratePass}
          >
            {createPass.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialIcons name="qr-code-2" size={24} color="#ffffff" />
                <Text style={styles.generateBtnText}>Generate Pass</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* QR Pass Ready Modal */}
        <Modal visible={showQRModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Guest Pass Ready</Text>
                <TouchableOpacity onPress={() => setShowQRModal(false)}>
                  <MaterialIcons name="close" size={22} color={theme.colors.outline} />
                </TouchableOpacity>
              </View>

              <View style={styles.qrImageWrapper}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2LpYGGNiwDjVdo7m7cL0pTWRAbAvJdRR_YHMvprWI-QjzHWlEOjJkYRXFhaw7tkzcKCvQEZ9_EfHg38An9LhinqtyMwvTcwYhXlMaj3qnTzEVBb21vt2lDxvWahlhtFaUGTaavxFgOHEOfH3OMIuY0CwQqH4mFL8pQRRqS7yQ1embFJhUsGOH5mtNmHz3v4OYA5zdO48LVx783d86X5g0zJspErEOxRSZYiZ0itjEo8Aq40ugqrIrZQ" }}
                  style={styles.qrImage}
                />
              </View>
              <Text style={styles.modalInfoText}>Pass sent to {mobileNumber || "+1 (555) 000-0000"}</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.shareBtn} onPress={() => Alert.alert("Shared", "Pass details copied to clipboard.")}>
                  <MaterialIcons name="share" size={16} color="#ffffff" />
                  <Text style={styles.shareBtnText}>Share Manually</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topAppBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingTop: 32,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(198, 198, 205, 0.2)",
    zIndex: 50,
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
  avatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 96,
    paddingBottom: 40,
  },
  heroCard: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  heroTitle: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    height: 48,
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
  },
  rightInputIcon: {
    position: "absolute",
    right: 12,
  },
  textInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 40,
    paddingRight: 16,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  textInputFlat: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  categoryBtn: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  categoryBtnActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.secondaryContainer,
  },
  categoryBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  categoryBtnTextActive: {
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(198, 198, 205, 0.2)",
    marginVertical: 4,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleTitle: {
    ...theme.typography.button,
    color: theme.colors.onSurface,
  },
  toggleDesc: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: "row",
    gap: 12,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(134,242,228,0.3)",
    marginTop: theme.spacing.lg,
  },
  infoText: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.secondary,
    lineHeight: 18,
  },
  generateBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: theme.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  generateBtnText: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  qrImageWrapper: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  qrImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  modalInfoText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  modalActions: {
    width: "100%",
    gap: 10,
    marginTop: 8,
  },
  shareBtn: {
    backgroundColor: theme.colors.secondary,
    height: 48,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  shareBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
  },
  doneBtn: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  doneBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
});
