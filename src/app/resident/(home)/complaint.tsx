import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Image, Switch, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../../theme";

export default function RaiseComplaintScreen() {
  const router = useRouter();

  // Form States
  const [category, setCategory] = useState<"Plumbing" | "Electrical" | "Security" | "Cleaning" | "Others">("Plumbing");
  const [description, setDescription] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tickets List State
  const [tickets, setTickets] = useState([
    {
      id: "HC-4829",
      title: "Power Outage - Lobby",
      category: "Electrical",
      time: "Reported 2h ago",
      status: "In Progress",
    },
    {
      id: "HC-4711",
      title: "Intercom Faulty",
      category: "Security",
      time: "Reported 3 days ago",
      status: "Resolved",
    }
  ]);

  const categoryList: Array<"Plumbing" | "Electrical" | "Security" | "Cleaning" | "Others"> = [
    "Plumbing",
    "Electrical",
    "Security",
    "Cleaning",
    "Others",
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Plumbing":
        return "plumbing";
      case "Electrical":
        return "flash-on";
      case "Security":
        return "security";
      case "Cleaning":
        return "cleaning-services";
      default:
        return "more-horiz";
    }
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert("Error", "Please provide a description of the issue.");
      return;
    }

    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      const newTicket = {
        id: `HC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${category} Issue - ${description.substring(0, 15)}...`,
        category: category,
        time: "Reported Just now",
        status: "In Progress",
      };
      setTickets([newTicket, ...tickets]);
      setIsSubmitting(false);
      setDescription("");
      setUrgent(false);
      Alert.alert("Success", "Your complaint ticket has been submitted successfully!");
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.outerContainer}>
        <StatusBar style="light" />

        {/* Top App Bar */}
        <View style={styles.topAppBar}>
          <View style={styles.topAppBarLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.appBarTitle}>Raise Complaint</Text>
          </View>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuArO9B-fwYDTwj9zTWlgpzRCxW_L3BzCKTQsjHCsKmKXBeq-0m6NMIdpW3OdHcgbiyIA1IHHbgCtTQpLO6jClxBcA1jsJHrpAHgrvS7NlIH6CNDnrAbZLm-4wjnzt52tjS3n8iatSqIqjjHpHyIfjMXy9FO-M8Yziwatcef8sL_a5i0kvjt9EYTcAeXs6-5KexhAW0fV96z4XqLkuSBj_pPxLa1RAQY7ap40TWoozA-LKAnAw7swnRMOg" }}
              style={styles.avatar}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Hero Instructions */}
          <Text style={styles.welcomeText}>
            Please provide details about the issue you're facing. Our management team will resolve it within 24-48 hours.
          </Text>

          {/* Form Card */}
          <View style={styles.formContainer}>
            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {categoryList.map((cat) => {
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
                        color={isSelected ? theme.colors.secondary : theme.colors.outline}
                      />
                      <Text style={[styles.categoryBtnText, isSelected && styles.categoryBtnTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description Textarea */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Describe the issue in detail (e.g., Leaking pipe in master bathroom...)"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={theme.colors.outline}
                style={styles.textInputArea}
              />
            </View>

            {/* Urgent Toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Mark as Urgent</Text>
                <Text style={styles.toggleDesc}>Flag this for immediate security attention.</Text>
              </View>
              <Switch
                value={urgent}
                onValueChange={setUrgent}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Image Upload Area */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Attach Photos</Text>
              <View style={styles.uploadRow}>
                {/* Dashed trigger */}
                <TouchableOpacity style={styles.uploadBtn} onPress={() => Alert.alert("Upload Image", "Access system photo library...")}>
                  <MaterialIcons name="add-a-photo" size={24} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.uploadBtnText}>UPLOAD</Text>
                </TouchableOpacity>

                {/* Preview Placeholder */}
                <View style={styles.previewCard}>
                  <Image
                    source={{ uri: "https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg" }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity style={styles.closeBtn} onPress={() => Alert.alert("Removed", "Photo removed from attachment.")}>
                    <MaterialIcons name="close" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} disabled={isSubmitting} onPress={handleSubmit}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color="#ffffff" />
                  <Text style={styles.submitBtnText}>SUBMIT COMPLAINT</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Recent Tickets Section */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Tickets</Text>
              <TouchableOpacity onPress={() => Alert.alert("Tickets", "All historical tickets are up to date.")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ticketsList}>
              {tickets.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.ticketCard}
                  onPress={() => Alert.alert(t.title, `Ticket ID: ${t.id}\nCategory: ${t.category}\nStatus: ${t.status}`)}
                >
                  <View style={styles.ticketLeft}>
                    <View style={styles.ticketIconBox}>
                      <MaterialIcons name={getCategoryIcon(t.category)} size={22} color={theme.colors.secondary} />
                    </View>
                    <View>
                      <Text style={styles.ticketTitleText}>{t.title}</Text>
                      <Text style={styles.ticketDetails}>ID: {t.id} • {t.time}</Text>
                    </View>
                  </View>
                  <View style={styles.ticketRight}>
                    <View style={[styles.statusBadge, { backgroundColor: t.status === "Resolved" ? "rgba(0,106,97,0.1)" : "rgba(118,119,125,0.1)" }]}>
                      <Text style={[styles.statusBadgeText, { color: t.status === "Resolved" ? theme.colors.secondary : theme.colors.outline }]}>
                        {t.status}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Support FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => Alert.alert("Helpdesk Assistant", "Connecting to property executive chat...")}>
          <MaterialIcons name="support-agent" size={26} color="#ffffff" />
        </TouchableOpacity>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 96,
    paddingBottom: 100,
    gap: theme.spacing.lg,
  },
  welcomeText: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  formContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    gap: 18,
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBtn: {
    width: "30%",
    flexGrow: 1,
    minHeight: 64,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  categoryBtnActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: "rgba(0,106,97,0.05)",
  },
  categoryBtnText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  categoryBtnTextActive: {
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  textInputArea: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    minHeight: 96,
    padding: 12,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(198, 198, 205, 0.2)",
    paddingTop: 12,
  },
  toggleTitle: {
    ...theme.typography.button,
    color: theme.colors.onSurface,
    fontWeight: "700",
  },
  toggleDesc: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  uploadRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  uploadBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  uploadBtnText: {
    fontSize: 9,
    fontWeight: "800",
    color: theme.colors.onSurfaceVariant,
  },
  previewCard: {
    width: 80,
    height: 80,
    borderRadius: 12,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  closeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(186, 26, 26, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  recentSection: {
    gap: 12,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  viewAllText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
  },
  ticketsList: {
    gap: 10,
  },
  ticketCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.2)",
  },
  ticketLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  ticketIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  ticketTitleText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  ticketDetails: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  ticketRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 40,
  },
});
