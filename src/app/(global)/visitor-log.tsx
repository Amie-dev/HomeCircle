import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../theme";
import { useProfileStore } from "../../store/useProfileStore";

interface LogEntry {
  id: string;
  name: string;
  type: "Guest" | "Delivery" | "Cab" | "Daily Help";
  unit: string;
  time: string;
  entryTime?: string;
  status: "Entered" | "Exited";
  date: "Today" | "Yesterday";
  avatar?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  
  // Details for popup
  residentName?: string;
  residentFlat?: string;
  approvedByResident?: string;
  guardName?: string;
  guardGate?: string;
  vehicleNumber?: string;
}

export default function VisitorLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isLoadingProfile } = useProfileStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("Today");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // New visitor form state
  const [newVisitorName, setNewVisitorName] = useState("");
  const [newVisitorUnit, setNewVisitorUnit] = useState("");
  const [newVisitorType, setNewVisitorType] = useState<"Guest" | "Delivery" | "Cab" | "Daily Help">("Guest");

  // Mock Logs state to allow dynamic entry additions
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "log-1",
      name: "Amit Sharma",
      type: "Guest",
      unit: "Unit 402-B",
      time: "10:45 AM",
      status: "Entered",
      date: "Today",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuOdDE5j2C-0ASjDtZNWk0ew-XXnz5MHm827U6HzT44T-bkzs9daP-O5g6qNEJw-MFqiQOE-oXfJ3k9zSmgv05o4h8a4iOcjDQjIF9YvDCQS8X9oKB4jc5IMjct3IdzBa4cQ2z4bfxVPIULqdhqxFE7zBCe64hgsV8MRpGxD9LMnUQGTuHjQtqCa_Rti2v-brPHTMH0XlSjI1-pGCu5WnWS-ZBTlQWYuXa5h2-fglctvHkVjb7NFXUOoQ",
      residentName: "Sarah Miller",
      residentFlat: "Unit 402-B, Block C",
      approvedByResident: "Sarah Miller (Approved via App)",
      guardName: "Officer Dev Singh",
      guardGate: "Main Security Gate",
      vehicleNumber: "N/A",
    },
    {
      id: "log-2",
      name: "Zomato Delivery",
      type: "Delivery",
      unit: "Unit 105-A",
      time: "11:35 AM",
      entryTime: "11:20 AM",
      status: "Exited",
      date: "Today",
      icon: "delivery-dining",
      residentName: "John Doe",
      residentFlat: "Unit 105-A, Block A",
      approvedByResident: "John Doe (Auto-Approved for Delivery)",
      guardName: "Officer Dev Singh",
      guardGate: "Main Security Gate",
      vehicleNumber: "KA-51-EF-4321",
    },
    {
      id: "log-3",
      name: "Rajesh Kumar",
      type: "Daily Help",
      unit: "Unit 604-D",
      time: "08:15 AM",
      status: "Entered",
      date: "Today",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGPT-qG5A5NJuVBqlnlvGu64L0r1Ip8269KzywtLrQ8aX4lUvjsuxVB-9Jjgkp6Wc78sy6V3n4I_1nG2jHUE4KqjRe_f1bVxg8YW3GDns3M6DsSis9KrukBXPEVsTuDQiD32YjXgnUT0PwXcUgummA4InTxXAxW7k0f9glGrzIfxcXWqWc9zkbl1pAWhWTzJ2NQ74Cxy9tKB6p87zi-HygNk3343Hlc1l4dWT8FuSngpB1ta8n4q0bPA",
      residentName: "Amit Patel",
      residentFlat: "Unit 604-D, Block F",
      approvedByResident: "Amit Patel (Pre-approved Daily Help)",
      guardName: "Officer Ram Charan",
      guardGate: "Service Gate 2",
      vehicleNumber: "N/A",
    },
    {
      id: "log-4",
      name: "Uber (KA-01-AB-1234)",
      type: "Cab",
      unit: "Unit 201-C",
      time: "07:50 AM",
      status: "Exited",
      date: "Yesterday",
      icon: "directions-car",
      residentName: "Priya Rao",
      residentFlat: "Unit 201-C, Block B",
      approvedByResident: "Priya Rao (Approved via App)",
      guardName: "Officer Dev Singh",
      guardGate: "Main Security Gate",
      vehicleNumber: "KA-01-AB-1234",
    },
    {
      id: "log-5",
      name: "Ananya Sen",
      type: "Guest",
      unit: "Unit 302-F",
      time: "04:15 PM",
      status: "Entered",
      date: "Yesterday",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxEpqrCszbXqFNXGK4BENBWGxAGz_oErQXNnl1NeFr9DjIQf-CInJptwJSpWL8OWGGO-aPv3BDSUCL-Kp8GaVuSL3UW-v-6CgIquryYECMqH7B3WimZJq099rNb9CRFNw_-8GNZU_idcFgggFB4U2CLgYtVfW_hnxfGNqsNVbCzMk0l31rzgj0sitICiajTHYAQno0Cm6n-TqHQSZAXvW30zBHzs6xHAqvXPEcLfQCQ2Xx-CIjwSPzJQ",
      residentName: "Sarah Miller",
      residentFlat: "Unit 302-F, Block B",
      approvedByResident: "Sarah Miller (Approved via App)",
      guardName: "Officer Ram Charan",
      guardGate: "Main Security Gate",
      vehicleNumber: "N/A",
    },
    {
      id: "log-6",
      name: "DHL Courier",
      type: "Delivery",
      unit: "Unit 501-A",
      time: "02:30 PM",
      entryTime: "02:10 PM",
      status: "Exited",
      date: "Yesterday",
      icon: "local-shipping",
      residentName: "Vikas Kumar",
      residentFlat: "Unit 501-A, Block D",
      approvedByResident: "Vikas Kumar (Approved via Code)",
      guardName: "Officer Dev Singh",
      guardGate: "Main Security Gate",
      vehicleNumber: "MH-02-XY-9876",
    },
  ]);

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  // Session guard
  if (!profile) {
    return <Redirect href="/get-started" />;
  }

  // Role check guard: Only Guard and Admin can access
  if (profile.role !== "Guard" && profile.role !== "Admin") {
    return <Redirect href="/" />;
  }

  const filters = ["Today", "Yesterday", "Delivery", "Guests", "Cab"];

  // Filtering Logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.unit.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (selectedFilter === "Today") {
      matchesFilter = log.date === "Today";
    } else if (selectedFilter === "Yesterday") {
      matchesFilter = log.date === "Yesterday";
    } else if (selectedFilter === "Delivery") {
      matchesFilter = log.type === "Delivery";
    } else if (selectedFilter === "Guests") {
      matchesFilter = log.type === "Guest";
    } else if (selectedFilter === "Cab") {
      matchesFilter = log.type === "Cab";
    }

    return matchesSearch && matchesFilter;
  });

  const handleAddEntry = () => {
    if (!newVisitorName.trim() || !newVisitorUnit.trim()) {
      Alert.alert("Required Fields", "Please enter both name and unit number.");
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      name: newVisitorName,
      type: newVisitorType,
      unit: newVisitorUnit.startsWith("Unit") ? newVisitorUnit : `Unit ${newVisitorUnit}`,
      time: formattedTime,
      status: "Entered",
      date: "Today",
      icon: newVisitorType === "Delivery"
        ? "delivery-dining"
        : newVisitorType === "Cab"
        ? "directions-car"
        : newVisitorType === "Daily Help"
        ? "cleaning-services"
        : undefined,
      residentName: `Resident of Flat ${newVisitorUnit}`,
      residentFlat: newVisitorUnit.startsWith("Unit") ? newVisitorUnit : `Unit ${newVisitorUnit}`,
      approvedByResident: `Resident of Flat ${newVisitorUnit} (Pre-Approved)`,
      guardName: profile?.fullName || "Active Guard",
      guardGate: "Main Security Gate",
      vehicleNumber: newVisitorType === "Cab" ? "Verified Cab" : "N/A",
    };

    setLogs([newLog, ...logs]);
    setShowAddModal(false);
    setNewVisitorName("");
    setNewVisitorUnit("");
    setNewVisitorType("Guest");

    Alert.alert("Success", `Check-in entry created for ${newVisitorName}!`);
  };

  const toggleLogStatus = (id: string) => {
    setLogs(
      logs.map((log) => {
        if (log.id === id) {
          const now = new Date();
          const formattedTime = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          if (log.status === "Entered") {
            return {
              ...log,
              status: "Exited",
              entryTime: log.time,
              time: formattedTime,
            };
          } else {
            return {
              ...log,
              status: "Entered",
              time: formattedTime,
              entryTime: undefined,
            };
          }
        }
        return log;
      })
    );
  };

  return (
    <View style={[styles.outerContainer, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Visitor Log</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Alert.alert("Filter", "Search name or use category chips to filter logs.")}
        >
          <MaterialIcons name="filter-list" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search & Filter Area */}
        <View style={styles.filterArea}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={theme.colors.outline} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name or unit..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="close" size={18} color={theme.colors.outline} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {filters.map((filter) => {
              const isSelected = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipSelected : styles.chipUnselected,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Timeline Section */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={styles.sectionTitle}>Recent Movements</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredLogs.length} {selectedFilter}</Text>
            </View>
          </View>

          {/* Log Entries */}
          {filteredLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="badge" size={48} color={theme.colors.outlineVariant} />
              <Text style={styles.emptyText}>No movements logged for this filter.</Text>
            </View>
          ) : (
            <View style={styles.logsList}>
              {filteredLogs.map((log) => (
                <TouchableOpacity
                  key={log.id}
                  style={styles.logCard}
                  onPress={() => {
                    setSelectedLog(log);
                    setShowDetailModal(true);
                  }}
                >
                  {log.avatar ? (
                    <Image source={{ uri: log.avatar }} style={styles.logAvatar} />
                  ) : (
                    <View style={styles.logIconWrapper}>
                      <MaterialIcons
                        name={log.icon || "person"}
                        size={28}
                        color={theme.colors.outline}
                      />
                    </View>
                  )}

                  <View style={styles.logInfo}>
                    <View style={styles.logNameRow}>
                      <Text style={styles.logName} numberOfLines={1}>{log.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          log.status === "Entered"
                            ? styles.statusBadgeEntered
                            : styles.statusBadgeExited,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            log.status === "Entered"
                              ? styles.statusBadgeTextEntered
                              : styles.statusBadgeTextExited,
                          ]}
                        >
                          {log.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.logDetail}>
                      {log.type} • {log.unit}
                    </Text>

                    <View style={styles.logTimeRow}>
                      {log.status === "Exited" && log.entryTime ? (
                        <>
                          <MaterialIcons name="login" size={14} color={theme.colors.outline} />
                          <Text style={styles.logTimeText}>{log.entryTime}</Text>
                          <View style={styles.timeDivider} />
                          <MaterialIcons name="logout" size={14} color={theme.colors.outline} />
                          <Text style={styles.logTimeText}>{log.time}</Text>
                        </>
                      ) : (
                        <>
                          <MaterialIcons name="schedule" size={14} color={theme.colors.outline} />
                          <Text style={styles.logTimeText}>{log.time}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Entry Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Visitor Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Visitor Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Rahul Sharma"
                  value={newVisitorName}
                  onChangeText={setNewVisitorName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Unit / Flat Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 402-B"
                  value={newVisitorUnit}
                  onChangeText={setNewVisitorUnit}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Visitor Type</Text>
                <View style={styles.typeSelector}>
                  {(["Guest", "Delivery", "Cab", "Daily Help"] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        newVisitorType === type
                          ? styles.typeChipSelected
                          : styles.typeChipUnselected,
                      ]}
                      onPress={() => setNewVisitorType(type)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          newVisitorType === type
                            ? styles.typeChipTextSelected
                            : styles.typeChipTextUnselected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddEntry}
              >
                <Text style={styles.submitBtnText}>Check In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDetailModal(false);
          setSelectedLog(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visitor Details</Text>
              <TouchableOpacity onPress={() => {
                setShowDetailModal(false);
                setSelectedLog(null);
              }}>
                <MaterialIcons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <ScrollView contentContainerStyle={styles.detailModalBody} showsVerticalScrollIndicator={false}>
                {/* Guest Profile Section */}
                <View style={styles.detailProfileSection}>
                  {selectedLog.avatar ? (
                    <Image source={{ uri: selectedLog.avatar }} style={styles.detailAvatar} />
                  ) : (
                    <View style={[styles.logIconWrapper, { width: 72, height: 72, borderRadius: 36 }]}>
                      <MaterialIcons
                        name={selectedLog.icon || "person"}
                        size={40}
                        color={theme.colors.outline}
                      />
                    </View>
                  )}
                  <Text style={styles.detailGuestName}>{selectedLog.name}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.detailTypeBadge}>
                      <Text style={styles.detailTypeBadgeText}>{selectedLog.type}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        selectedLog.status === "Entered"
                          ? styles.statusBadgeEntered
                          : styles.statusBadgeExited,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          selectedLog.status === "Entered"
                            ? styles.statusBadgeTextEntered
                            : styles.statusBadgeTextExited,
                        ]}
                      >
                        {selectedLog.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Info Cards */}
                <View style={styles.detailSectionCards}>
                  {/* Guest Info Card */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <MaterialIcons name="badge" size={18} color={theme.colors.secondary} />
                      <Text style={styles.detailCardTitle}>Guest Information</Text>
                    </View>
                    <View style={styles.detailCardRow}>
                      <Text style={styles.detailRowLabel}>Vehicle No:</Text>
                      <Text style={styles.detailRowValue}>{selectedLog.vehicleNumber || "N/A"}</Text>
                    </View>
                    <View style={styles.detailCardRow}>
                      <Text style={styles.detailRowLabel}>Check-In Time:</Text>
                      <Text style={styles.detailRowValue}>
                        {selectedLog.entryTime || selectedLog.time} ({selectedLog.date})
                      </Text>
                    </View>
                    {selectedLog.status === "Exited" && (
                      <View style={styles.detailCardRow}>
                        <Text style={styles.detailRowLabel}>Check-Out Time:</Text>
                        <Text style={styles.detailRowValue}>{selectedLog.time} ({selectedLog.date})</Text>
                      </View>
                    )}
                  </View>

                  {/* Resident Info Card */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <MaterialIcons name="home" size={18} color={theme.colors.secondary} />
                      <Text style={styles.detailCardTitle}>Host (Resident) Details</Text>
                    </View>
                    <View style={styles.detailCardRow}>
                      <Text style={styles.detailRowLabel}>Resident Name:</Text>
                      <Text style={styles.detailRowValue}>{selectedLog.residentName || "N/A"}</Text>
                    </View>
                    <View style={styles.detailCardRow}>
                      <Text style={styles.detailRowLabel}>Flat No:</Text>
                      <Text style={styles.detailRowValue}>{selectedLog.residentFlat || selectedLog.unit}</Text>
                    </View>
                    <View style={styles.detailCardRow}>
                      <Text style={styles.detailRowLabel}>Approved By:</Text>
                      <Text style={[styles.detailRowValue, { color: theme.colors.secondary, fontWeight: "600" }]}>
                        {selectedLog.approvedByResident || "Resident Pre-Approved"}
                      </Text>
                    </View>
                  </View>

                  {/* Guard Info Card */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailCardHeader}>
                      <MaterialIcons name="security" size={18} color={theme.colors.secondary} />
                      <Text style={styles.detailCardTitle}>Security Guard Log</Text>
                    </View>
                    <View style={styles.detailCardRow}>
                      <Text style={styles.detailRowLabel}>Verified By Guard:</Text>
                      <Text style={styles.detailRowValue}>{selectedLog.guardName || "N/A"}</Text>
                    </View>
                    <View style={styles.detailCardRow}>
                      <Text style={styles.detailRowLabel}>Checked Gate:</Text>
                      <Text style={styles.detailRowValue}>{selectedLog.guardGate || "Main Security Gate"}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              {selectedLog && (
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    toggleLogStatus(selectedLog.id);
                    // Update current selected log display
                    if (selectedLog.status === "Entered") {
                      const now = new Date();
                      const formattedTime = now.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });
                      setSelectedLog({
                        ...selectedLog,
                        status: "Exited",
                        entryTime: selectedLog.time,
                        time: formattedTime,
                      });
                    } else {
                      const now = new Date();
                      const formattedTime = now.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });
                      setSelectedLog({
                        ...selectedLog,
                        status: "Entered",
                        time: formattedTime,
                        entryTime: undefined,
                      });
                    }
                    Alert.alert("Success", `Status toggled successfully.`);
                  }}
                >
                  <Text style={styles.submitBtnText}>
                    {selectedLog.status === "Entered" ? "Check Out Visitor" : "Check In Visitor"}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  outerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconBtn: {
    padding: theme.spacing.xs,
    borderRadius: theme.rounded.full,
  },
  appBarTitle: {
    ...theme.typography.headlineLgMobile,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  scrollContainer: {
    paddingBottom: 80, // Space for FAB
  },
  filterArea: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.md,
    paddingHorizontal: theme.spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.onSurface,
    ...theme.typography.bodyMd,
    paddingVertical: 0,
  },
  chipsScroll: {
    paddingVertical: 4,
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.rounded.full,
    marginRight: 6,
  },
  chipSelected: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  chipText: {
    ...theme.typography.labelMd,
    fontSize: 12,
  },
  chipTextSelected: {
    color: theme.colors.onSecondaryContainer,
    fontWeight: "600",
  },
  chipTextUnselected: {
    color: theme.colors.onSurfaceVariant,
  },
  timelineSection: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  countBadge: {
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.rounded.default,
  },
  countText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  logsList: {
    gap: theme.spacing.sm,
  },
  logCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  logAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.rounded.full,
    resizeMode: "cover",
  },
  logIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: theme.rounded.full,
    backgroundColor: theme.colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  logInfo: {
    flex: 1,
  },
  logNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  logName: {
    ...theme.typography.bodyLg,
    fontWeight: "700",
    color: theme.colors.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.rounded.default,
  },
  statusBadgeEntered: {
    backgroundColor: "rgba(0, 106, 97, 0.1)",
  },
  statusBadgeExited: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  statusBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadgeTextEntered: {
    color: theme.colors.secondary,
  },
  statusBadgeTextExited: {
    color: theme.colors.onSurfaceVariant,
  },
  logDetail: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  logTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  logTimeText: {
    ...theme.typography.labelMd,
    fontSize: 11,
    color: theme.colors.outline,
  },
  timeDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.outlineVariant,
    marginHorizontal: 4,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: theme.spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: theme.rounded.lg,
    borderTopRightRadius: theme.rounded.lg,
    padding: theme.spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerLow,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  modalForm: {
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  formGroup: {
    gap: theme.spacing.xs,
  },
  formLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  formInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.default,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    color: theme.colors.onSurface,
    ...theme.typography.bodyLg,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  typeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.rounded.full,
    borderWidth: 1,
  },
  typeChipSelected: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondary,
  },
  typeChipUnselected: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.outlineVariant,
  },
  typeChipText: {
    ...theme.typography.labelMd,
  },
  typeChipTextSelected: {
    color: theme.colors.onSecondaryContainer,
    fontWeight: "600",
  },
  typeChipTextUnselected: {
    color: theme.colors.onSurfaceVariant,
  },
  modalFooter: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingBottom: Platform.OS === "ios" ? 16 : 0,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.rounded.default,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  cancelBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSurface,
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.rounded.default,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
  },
  detailModalBody: {
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  detailProfileSection: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerLow,
  },
  detailAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    resizeMode: "cover",
  },
  detailGuestName: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  badgeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  detailTypeBadge: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.rounded.full,
  },
  detailTypeBadgeText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  detailSectionCards: {
    gap: theme.spacing.md,
  },
  detailCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    borderRadius: theme.rounded.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainerLow,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  detailCardTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  detailCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailRowLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  detailRowValue: {
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
    fontWeight: "600",
  },
});
