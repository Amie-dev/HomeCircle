import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { theme } from "../../../theme";
import { useProfileStore } from "../../../store/useProfileStore";
import { supabase } from "../../../../utils/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sendPushNotification } from "../../../../utils/notificationService";

export default function GuardScanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);

  // Manual Walk-in Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("Guest"); // Guest, Delivery, Service
  const [towerNo, setTowerNo] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [registering, setRegistering] = useState(false);

  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Running the scanner laser line animation
  useEffect(() => {
    if (scanning && permission?.granted) {
      const runAnimation = () => {
        scanLineAnim.setValue(0);
        Animated.loop(
          Animated.sequence([
            Animated.timing(scanLineAnim, {
              toValue: 216, // Height of scanner view (220 - line height 4)
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(scanLineAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      runAnimation();
    } else {
      scanLineAnim.setValue(0);
    }
  }, [scanning, permission?.granted]);

  const fetchRecentLogs = async () => {
    if (!profile?.societyId) return;
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from("visitor_logs")
        .select(`
          id,
          created_at,
          action_type,
          requestpasses!inner (
            visitor_name,
            designation,
            tower_no,
            flat_no
          )
        `)
        .eq("requestpasses.resident_details->>societyId", profile.societyId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      if (data) {
        setRecentLogs(data);
      }
    } catch (err: any) {
      console.error("Error fetching logs:", err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (profile?.societyId) {
      fetchRecentLogs();
    }
  }, [profile?.societyId]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (!profile?.isVerified) {
      Alert.alert(
        "Access Denied",
        "Your guard account is pending verification by the society admin.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
      return;
    }

    try {
      // Query pass from database
      const { data: pass, error } = await supabase
        .from("requestpasses")
        .select("*")
        .eq("id", data)
        .maybeSingle();

      if (error) throw error;

      if (!pass) {
        Alert.alert(
          "Invalid Pass",
          "This pass QR code is invalid or does not exist in our system.",
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
        return;
      }

      if (pass.status !== "Approved") {
        Alert.alert(
          "Access Denied",
          `This pass current status is: ${pass.status}. Access is not approved.`,
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
        return;
      }

      // Check if it is expired
      const validUntil = new Date(pass.valid_until);
      if (validUntil.getTime() < Date.now()) {
        Alert.alert(
          "Pass Expired",
          `This pass was valid until ${validUntil.toLocaleDateString()}.`,
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
        return;
      }

      // Check society matching
      const targetSocietyId = pass.resident_details?.societyId;
      if (targetSocietyId && targetSocietyId !== profile.societyId) {
        Alert.alert(
          "Wrong Society",
          "This pass is registered for another residential society.",
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
        return;
      }

      // Log in visitor_logs
      const { error: logErr } = await supabase
        .from("visitor_logs")
        .insert({
          pass_id: pass.id,
          guard_id: profile.id,
          action_type: "Check-in",
        });

      if (logErr) throw logErr;

      // Update pass status to Verified
      const { error: updateErr } = await supabase
        .from("requestpasses")
        .update({
          status: "Verified",
          verified_at: new Date().toISOString(),
          verified_by: profile.fullName,
        })
        .eq("id", pass.id);

      if (updateErr) throw updateErr;

      // Notify flat admin/resident of the check-in
      try {
        const { data: flatData } = await supabase
          .from("flats")
          .select("id")
          .eq("flat_number", pass.flat_no)
          .maybeSingle();

        if (flatData) {
          const { data: member } = await supabase
            .from("societymembers")
            .select("user_id")
            .eq("flat_id", flatData.id)
            .maybeSingle();

          if (member) {
            // Send push notification to resident
            try {
              const { data: resUserData } = await supabase
                .from("users")
                .select("notification_token")
                .eq("id", member.user_id)
                .maybeSingle();

              if (resUserData?.notification_token) {
                await sendPushNotification({
                  token: resUserData.notification_token,
                  title: "Visitor Checked In 🚪",
                  body: `${pass.visitor_name} has checked in at the gate.`,
                  data: {
                    screen: "/resident",
                    url: "/resident",
                  },
                });
              }
            } catch (err) {
              console.warn("Failed to send push notification to resident:", err);
            }

            // Insert resident notification log in db
            await supabase
              .from("push_notifications")
              .insert({
                user_id: member.user_id,
                title: "Visitor Checked In 🚪",
                body: `${pass.visitor_name} has checked in at the gate.`,
                screen: "/resident",
                status: "Sent",
              });
          }
        }
      } catch (notifErr) {
        console.warn("Failed to notify resident of visitor check-in:", notifErr);
      }

      // Notify visitor of check-in
      try {
        if (pass.user_id) {
          // Send push notification to visitor
          try {
            const { data: visUserData } = await supabase
              .from("users")
              .select("notification_token")
              .eq("id", pass.user_id)
              .maybeSingle();

            if (visUserData?.notification_token) {
              await sendPushNotification({
                token: visUserData.notification_token,
                title: "Pass Verified ✔️",
                body: "Your pass has been scanned and verified at the gate.",
                data: {
                  screen: "/request-pass",
                  url: "/request-pass",
                },
              });
            }
          } catch (err) {
            console.warn("Failed to send push notification to visitor:", err);
          }

          // Insert visitor notification log in db
          await supabase
            .from("push_notifications")
            .insert({
              user_id: pass.user_id,
              title: "Pass Verified ✔️",
              body: "Your pass has been scanned and verified at the gate.",
              screen: "/request-pass",
              status: "Sent",
            });
        }
      } catch (visitorNotifErr) {
        console.warn("Failed to notify visitor of check-in:", visitorNotifErr);
      }

      Alert.alert(
        "Access Approved",
        `Visitor: ${pass.visitor_name}\nType: ${pass.designation}\nApartment: T-${pass.tower_no}, F-${pass.flat_no}\n\nEntry logged successfully.`,
        [{ text: "OK", onPress: () => {
          setScanned(false);
          fetchRecentLogs();
        }}]
      );
    } catch (err: any) {
      Alert.alert("Scan Error", err.message || "Failed to verify pass.", [
        { text: "OK", onPress: () => setScanned(false) }
      ]);
    }
  };

  const handleManualRegister = async () => {
    if (!visitorName.trim() || !phone.trim() || !towerNo.trim() || !flatNo.trim()) {
      Alert.alert("Incomplete Details", "Please fill in all required fields.");
      return;
    }
    if (!profile?.societyId) return;

    setRegistering(true);
    try {
      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + 2); // Valid for 2 hours

      // 1. Insert pass as pre-verified
      const { data: pass, error: passErr } = await supabase
        .from("requestpasses")
        .insert({
          visitor_name: visitorName.trim(),
          phone_number: phone.trim(),
          designation,
          tower_no: towerNo.trim(),
          flat_no: flatNo.trim(),
          vehicle_no: vehicleNo.trim() || null,
          status: "Verified",
          valid_until: validUntil.toISOString(),
          verified_at: new Date().toISOString(),
          verified_by: profile.fullName,
          resident_details: {
            societyId: profile.societyId,
            creatorRole: "Guard",
          },
        })
        .select()
        .single();

      if (passErr) throw passErr;

      // 2. Log in visitor_logs
      const { error: logErr } = await supabase
        .from("visitor_logs")
        .insert({
          pass_id: pass.id,
          guard_id: profile.id,
          action_type: "Check-in",
        });

      if (logErr) throw logErr;

      Alert.alert("Visitor Registered", `Check-in recorded for ${visitorName}`);
      setModalVisible(false);
      
      // Reset form
      setVisitorName("");
      setPhone("");
      setDesignation("Guest");
      setTowerNo("");
      setFlatNo("");
      setVehicleNo("");

      fetchRecentLogs();
    } catch (err: any) {
      Alert.alert("Registration Error", err.message || "Failed to register visitor.");
    } finally {
      setRegistering(false);
    }
  };

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Configuring Scanner...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badgeContainer}>
            <MaterialIcons name="security" size={16} color={theme.colors.onSecondaryContainer} />
            <Text style={styles.badgeText}>SECURITY GATE</Text>
          </View>
          <Text style={styles.headerTitle}>{profile?.fullName || "On-Duty Guard"}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchRecentLogs}
          activeOpacity={0.7}
        >
          <MaterialIcons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Gate Status notification block */}
        <View style={styles.statusNotifyRow}>
          <View style={styles.statusLeft}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>Scanner Active: Main Security Gate</Text>
          </View>
          <Text style={styles.gateLabel}>{profile?.societyName || "Greenwood Estate"}</Text>
        </View>

        {/* Camera Scanner View Area */}
        <View style={styles.scannerWrapper}>
          {!permission.granted ? (
            <View style={styles.permissionBox}>
              <MaterialIcons name="photo-camera" size={48} color={theme.colors.outline} />
              <Text style={styles.permissionText}>Camera permission is required to scan visitor pass QR codes.</Text>
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.8}>
                <Text style={styles.permissionBtnText}>Enable Camera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraBox}>
              {scanning ? (
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000", justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: "#fff", ...theme.typography.bodyMd }}>Scanner paused</Text>
                </View>
              )}

              {/* Scanning Target Overlay */}
              <View style={styles.overlayFrame}>
                <View style={styles.targetSquare}>
                  {/* Corners */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {/* Scanning Laser Line */}
                  {scanning && (
                    <Animated.View
                      style={[
                        styles.laserLine,
                        {
                          transform: [{ translateY: scanLineAnim }],
                        },
                      ]}
                    />
                  )}

                  <MaterialIcons
                    name="qr-code-scanner"
                    size={64}
                    color="rgba(134, 242, 228, 0.25)"
                  />
                </View>
                <Text style={styles.overlayLabel}>Position QR Code inside the square</Text>
              </View>

              {/* Float controls on Scanner */}
              <View style={styles.floatControls}>
                <TouchableOpacity
                  style={styles.floatBtn}
                  onPress={() => setScanning(prev => !prev)}
                >
                  <MaterialIcons
                    name={scanning ? "pause" : "play-arrow"}
                    size={20}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Manual Walk-in Section */}
        <View style={styles.manualSection}>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.9}
          >
            <MaterialIcons name="person-add" size={22} color={theme.colors.onSecondary} />
            <Text style={styles.manualBtnText}>Register Walk-in Visitor</Text>
          </TouchableOpacity>
          <Text style={styles.manualSub}>
            No invite? Register the visitor manually with ID verification.
          </Text>
        </View>

        {/* Recent Scans Logs */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Entries</Text>
            <TouchableOpacity onPress={() => router.push("/guard/logs" as any)}>
              <Text style={styles.viewAllText}>View Log</Text>
            </TouchableOpacity>
          </View>

          {loadingLogs ? (
            <ActivityIndicator size="small" color={theme.colors.secondary} style={{ padding: 20 }} />
          ) : (
            <View style={styles.logsList}>
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => {
                  const p = log.requestpasses;
                  const isCheckin = log.action_type === "Check-in";
                  return (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.logLeft}>
                        <View style={[styles.logIconBox, { backgroundColor: isCheckin ? "rgba(0, 106, 97, 0.08)" : "rgba(186, 26, 26, 0.08)" }]}>
                          <MaterialIcons
                            name={isCheckin ? "login" : "logout"}
                            size={20}
                            color={isCheckin ? theme.colors.secondary : theme.colors.error}
                          />
                        </View>
                        <View>
                          <Text style={styles.logName}>{p?.visitor_name || "Guest"}</Text>
                          <Text style={styles.logSub}>
                            Flat {p?.tower_no}-{p?.flat_no} • {p?.designation}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.logRight}>
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedBadgeText}>Verified</Text>
                        </View>
                        <Text style={styles.logTime}>
                          {new Date(log.created_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyLogs}>
                  <MaterialIcons name="assignment" size={32} color={theme.colors.outline} />
                  <Text style={styles.emptyLogsText}>No recent scans logged at this gate.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Manual Registration Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Walk-in Guest</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
              {/* Form Input fields */}
              <Text style={styles.inputLabel}>Visitor Full Name *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Enter visitor's full name"
                value={visitorName}
                onChangeText={setVisitorName}
                placeholderTextColor={theme.colors.outline}
              />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Enter 10-digit mobile number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor={theme.colors.outline}
              />

              <Text style={styles.inputLabel}>Purpose / Type</Text>
              <View style={styles.typeSelector}>
                {["Guest", "Delivery", "Service"].map((t) => {
                  const selected = designation === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, selected && styles.typeChipSelected]}
                      onPress={() => setDesignation(t)}
                    >
                      <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Tower *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. A"
                    value={towerNo}
                    onChangeText={setTowerNo}
                    placeholderTextColor={theme.colors.outline}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Flat *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. 402"
                    value={flatNo}
                    onChangeText={setFlatNo}
                    placeholderTextColor={theme.colors.outline}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Vehicle Number (Optional)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. HR 26 AL 1234"
                value={vehicleNo}
                onChangeText={setVehicleNo}
                placeholderTextColor={theme.colors.outline}
                autoCapitalize="characters"
              />

              {registering ? (
                <ActivityIndicator size="small" color={theme.colors.secondary} style={{ marginTop: 24 }} />
              ) : (
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleManualRegister}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>Check-in Visitor</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    gap: 12,
  },
  loadingText: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    height: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.containerMarginMobile,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 106, 97, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: "flex-start",
    gap: 4,
  },
  badgeText: {
    ...theme.typography.labelMd,
    fontSize: 9,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  headerTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.containerMarginMobile,
  },
  statusNotifyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.rounded.md,
    marginTop: theme.spacing.md,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  statusText: {
    ...theme.typography.labelMd,
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  gateLabel: {
    ...theme.typography.labelMd,
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: "700",
  },
  scannerWrapper: {
    width: "100%",
    aspectRatio: 1.1,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: "#131b2e",
  },
  permissionBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  permissionText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.rounded.default,
    marginTop: 12,
  },
  permissionBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
  },
  cameraBox: {
    flex: 1,
    position: "relative",
  },
  overlayFrame: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  targetSquare: {
    width: 220,
    height: 220,
    borderWidth: 1,
    borderColor: "rgba(134, 242, 228, 0.4)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: theme.colors.secondaryContainer,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  laserLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.secondaryContainer,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    zIndex: 20,
  },
  overlayLabel: {
    ...theme.typography.labelMd,
    color: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 20,
    overflow: "hidden",
  },
  floatControls: {
    position: "absolute",
    top: 16,
    right: 16,
    gap: 8,
  },
  floatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  manualSection: {
    marginTop: theme.spacing.lg,
    gap: 8,
  },
  manualBtn: {
    height: 52,
    backgroundColor: theme.colors.secondary,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  manualBtnText: {
    ...theme.typography.button,
    color: theme.colors.onSecondary,
    fontSize: 16,
  },
  manualSub: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  recentSection: {
    marginTop: theme.spacing.xl,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  recentTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
  },
  viewAllText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
  },
  logsList: {
    gap: 12,
  },
  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: theme.spacing.md,
  },
  logLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logName: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  logSub: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  logRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  verifiedBadge: {
    backgroundColor: "rgba(0, 106, 97, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    ...theme.typography.labelMd,
    fontSize: 8,
    color: theme.colors.secondary,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  logTime: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.outline,
  },
  emptyLogs: {
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyLogsText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  modalTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  inputLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 6,
    marginTop: 14,
  },
  inputField: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    ...theme.typography.bodyMd,
    color: theme.colors.primary,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  typeChip: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  typeChipSelected: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondary,
  },
  typeChipText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  typeChipTextSelected: {
    color: theme.colors.secondary,
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  submitBtn: {
    height: 52,
    backgroundColor: theme.colors.secondary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
    fontSize: 16,
  },
});
