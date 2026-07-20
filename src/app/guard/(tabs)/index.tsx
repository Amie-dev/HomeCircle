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

  // Scanned verification state
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [scannedPass, setScannedPass] = useState<any>(null);
  const [residentFlat, setResidentFlat] = useState<any>(null);
  const [residentTower, setResidentTower] = useState<any>(null);
  const [residentList, setResidentList] = useState<any[]>([]);
  const [actionProcessing, setActionProcessing] = useState(false);

  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [gateName, setGateName] = useState("Main Gate");

  useEffect(() => {
    const fetchActiveGate = async () => {
      if (!profile?.id) return;
      try {
        const { data, error } = await supabase
          .from("guard_assignments")
          .select("gate_name")
          .eq("guard_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0 && data[0]?.gate_name) {
          setGateName(data[0].gate_name);
        }
      } catch (err: any) {
        console.error("Error fetching guard assignment gate name:", err.message);
      }
    };

    fetchActiveGate();
  }, [profile?.id]);

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
      const expiryDate = pass.expiry_time;
      const validUntil = new Date(expiryDate);
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

      // Now query the matching resident details
      let matchedTower = null;
      let matchedFlat = null;
      let list: any[] = [];

      if (profile.societyId) {
        const { data: towersData } = await supabase
          .from("towers")
          .select("id, name, tower_id")
          .eq("society_id", profile.societyId);

        if (towersData) {
          matchedTower = towersData.find(
            (t) =>
              t.name?.toLowerCase() === pass.tower_no?.toLowerCase() ||
              t.tower_id?.toLowerCase() === pass.tower_no?.toLowerCase() ||
              t.name?.toLowerCase().includes(pass.tower_no?.toLowerCase())
          );
        }

        if (matchedTower) {
          const { data: flatData } = await supabase
            .from("flats")
            .select("id, flat_number, floor")
            .eq("tower_id", matchedTower.id)
            .eq("flat_number", pass.flat_no)
            .maybeSingle();

          if (flatData) {
            matchedFlat = flatData;

            const { data: membersData } = await supabase
              .from("societymembers")
              .select("user_id")
              .eq("flat_id", flatData.id);

            if (membersData && membersData.length > 0) {
              const userIds = membersData.map((m) => m.user_id);
              const { data: usersData } = await supabase
                .from("users")
                .select("id, full_name, email, phone, notification_token")
                .in("id", userIds);

              if (usersData) {
                list = await Promise.all(
                  usersData.map(async (u) => {
                    if (!u.notification_token) {
                      const { data: guestData } = await supabase
                        .from("guestusers")
                        .select("notification_token")
                        .eq("id", u.id)
                        .maybeSingle();
                      if (guestData?.notification_token) {
                        return { ...u, notification_token: guestData.notification_token };
                      }
                    }
                    return u;
                  })
                );
              }
            }
          }
        }
      }

      // Set scanned pass and matched resident details to state and open popup
      setScannedPass(pass);
      setResidentTower(matchedTower);
      setResidentFlat(matchedFlat);
      setResidentList(list);
      setVerificationModalVisible(true);

    } catch (err: any) {
      Alert.alert("Scan Error", err.message || "Failed to verify pass.", [
        { text: "OK", onPress: () => setScanned(false) }
      ]);
    }
  };

  const handleConfirmVerify = async () => {
    if (!scannedPass || !profile?.id) return;
    setActionProcessing(true);

    try {
      // 1. Log check-in in visitor_logs
      const { error: logErr } = await supabase
        .from("visitor_logs")
        .insert({
          pass_id: scannedPass.id,
          logged_by: profile.id,
          action_type: "Check-in",
          gate_name: gateName,
        });

      if (logErr) throw logErr;

      // 2. Update pass status to Verified
      const { error: updateErr } = await supabase
        .from("requestpasses")
        .update({
          status: "Verified",
          verified_at: new Date().toISOString(),
          verified_by: profile.fullName,
        })
        .eq("id", scannedPass.id);

      if (updateErr) throw updateErr;

      // 3. Notify flat admin/residents of the check-in
      for (const resident of residentList) {
        if (resident.notification_token) {
          try {
            await sendPushNotification({
              token: resident.notification_token,
              title: "Visitor Checked In 🚪",
              body: `${scannedPass.visitor_name} has checked in at the gate.`,
              data: {
                screen: "/resident",
                url: "/resident",
              },
            });
          } catch (err) {
            console.warn(`Failed to send push notification to resident ${resident.full_name}:`, err);
          }
        }

        try {
          await supabase
            .from("push_notifications")
            .insert({
              user_id: resident.id,
              title: "Visitor Checked In 🚪",
              body: `${scannedPass.visitor_name} has checked in at the gate.`,
              screen: "/resident",
              status: "Sent",
            });
        } catch (dbNotifErr) {
          console.warn(`Failed to log push notification for resident ${resident.full_name}:`, dbNotifErr);
        }
      }

      // 4. Notify guest of pass check-in using their email to fetch token
      try {
        const { data: guestData } = await supabase
          .from("guestusers")
          .select("id, notification_token")
          .eq("email", scannedPass.visitor_email)
          .maybeSingle();

        if (guestData) {
          if (guestData.notification_token) {
            try {
              await sendPushNotification({
                token: guestData.notification_token,
                title: "Pass Verified ✔️",
                body: "Your pass has been scanned and verified at the gate.",
                data: {
                  screen: "/request-pass",
                  url: "/request-pass",
                },
              });
            } catch (err) {
              console.warn("Failed to send push notification to visitor:", err);
            }
          }

          try {
            await supabase
              .from("push_notifications")
              .insert({
                user_id: guestData.id,
                title: "Pass Verified ✔️",
                body: "Your pass has been scanned and verified at the gate.",
                screen: "/request-pass",
                status: "Sent",
              });
          } catch (dbNotifErr) {
            console.warn("Failed to log push notification for visitor:", dbNotifErr);
          }
        }
      } catch (guestNotifErr) {
        console.warn("Failed to notify visitor:", guestNotifErr);
      }

      Alert.alert(
        "Access Approved",
        `Visitor: ${scannedPass.visitor_name}\nType: ${scannedPass.designation}\nApartment: T-${scannedPass.tower_no}, F-${scannedPass.flat_no}\n\nEntry logged successfully.`,
        [{ text: "OK", onPress: () => {
          setVerificationModalVisible(false);
          setScannedPass(null);
          setResidentTower(null);
          setResidentFlat(null);
          setResidentList([]);
          setScanned(false);
          fetchRecentLogs();
        }}]
      );
    } catch (err: any) {
      Alert.alert("Verification Error", err.message || "Failed to confirm check-in.");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleRejectPass = () => {
    Alert.alert(
      "Confirm Action",
      "Are you sure you want to reject this entry and invalidate the pass?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject Pass",
          style: "destructive",
          onPress: async () => {
            setActionProcessing(true);
            try {
              const { error: rejectErr } = await supabase
                .from("requestpasses")
                .update({
                  status: "Rejected",
                })
                .eq("id", scannedPass.id);

              if (rejectErr) throw rejectErr;

              Alert.alert(
                "Pass Rejected",
                "The pass has been successfully marked as rejected.",
                [{ text: "OK", onPress: () => {
                  setVerificationModalVisible(false);
                  setScannedPass(null);
                  setResidentTower(null);
                  setResidentFlat(null);
                  setResidentList([]);
                  setScanned(false);
                  fetchRecentLogs();
                }}]
              );
            } catch (err: any) {
              Alert.alert("Reject Error", err.message || "Failed to reject pass.");
            } finally {
              setActionProcessing(false);
            }
          }
        }
      ]
    );
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
          user_id: profile.id,
          visitor_name: visitorName.trim(),
          visitor_phone: phone.trim(),
          visitor_email: "walkin@homecircle.com",
          designation,
          tower_no: towerNo.trim(),
          flat_no: flatNo.trim(),
          status: "Verified",
          expiry_time: validUntil.toISOString(),
          verified_at: new Date().toISOString(),
          verified_by: profile.fullName,
          resident_details: {
            societyId: profile.societyId,
            creatorRole: "Guard",
            vehicleNumber: vehicleNo.trim() || null,
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
          logged_by: profile.id,
          action_type: "Check-in",
          gate_name: gateName,
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
            <TouchableOpacity onPress={() => router.push("/guard/(tabs)/logs" as any)}>
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

      {/* QR Code Scan Verification Modal */}
      <Modal
        visible={verificationModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          if (!actionProcessing) {
            setVerificationModalVisible(false);
            setScannedPass(null);
            setResidentTower(null);
            setResidentFlat(null);
            setResidentList([]);
            setScanned(false);
          }
        }}
      >
        <View style={styles.verificationModalOverlay}>
          <View style={styles.verificationModalContent}>
            <View style={styles.verificationModalHeader}>
              <MaterialIcons name="fact-check" size={26} color={theme.colors.primary} />
              <Text style={styles.verificationModalTitle}>Verify Visitor Entry</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.verificationScroll}>
              
              {/* Visitor Details Card */}
              <Text style={styles.sectionHeader}>VISITOR INFORMATION (SCANNED)</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="person" size={20} color={theme.colors.secondary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Visitor Name</Text>
                    <Text style={styles.infoVal}>{scannedPass?.visitor_name || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="phone" size={20} color={theme.colors.secondary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Phone Number</Text>
                    <Text style={styles.infoVal}>{scannedPass?.visitor_phone || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="email" size={20} color={theme.colors.secondary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Email Address</Text>
                    <Text style={styles.infoVal}>{scannedPass?.visitor_email || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="label" size={20} color={theme.colors.secondary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Purpose / Role</Text>
                    <Text style={[styles.infoVal, styles.designationTag]}>{scannedPass?.designation || "Guest"}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="meeting-room" size={20} color={theme.colors.secondary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Destination Flat</Text>
                    <Text style={styles.infoVal}>Tower {scannedPass?.tower_no}, Flat {scannedPass?.flat_no}</Text>
                  </View>
                </View>
              </View>

              {/* Resident Verification Card */}
              <Text style={styles.sectionHeader}>APPROVED RESIDENT DETAILS</Text>
              {residentFlat ? (
                <View style={[styles.infoCard, styles.verifiedResidentCard]}>
                  <View style={styles.statusBadgeSuccess}>
                    <MaterialIcons name="verified" size={14} color="#006a61" />
                    <Text style={styles.statusBadgeTextSuccess}>Resident Exists & Verified</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialIcons name="home" size={20} color="#006a61" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Matched Address</Text>
                      <Text style={styles.infoVal}>
                        Tower {residentTower?.name || scannedPass?.tower_no}, Flat {residentFlat?.flat_number}
                      </Text>
                    </View>
                  </View>

                  {residentList.length > 0 ? (
                    residentList.map((res, index) => (
                      <View key={res.id} style={[styles.infoRow, index > 0 && styles.infoRowDivider]}>
                        <MaterialIcons name="account-circle" size={20} color="#006a61" />
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>Resident Name</Text>
                          <Text style={styles.infoVal}>{res.full_name}</Text>
                          <Text style={styles.infoSubText}>{res.phone} • {res.email}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="warning" size={20} color={theme.colors.error} />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Resident Profile</Text>
                        <Text style={[styles.infoVal, { color: theme.colors.error }]}>No registered profile in flat</Text>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.infoCard, styles.mismatchResidentCard]}>
                  <View style={styles.statusBadgeError}>
                    <MaterialIcons name="report-problem" size={14} color={theme.colors.error} />
                    <Text style={styles.statusBadgeTextError}>MISMATCH / NOT FOUND</Text>
                  </View>
                  <Text style={styles.mismatchText}>
                    This flat ({scannedPass?.tower_no} - {scannedPass?.flat_no}) does not exist in the {profile?.societyName || "society"} directory or has not been registered yet.
                  </Text>
                </View>
              )}

            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.actionBtn, 
                  styles.verifyBtn, 
                  (!residentFlat || actionProcessing) && styles.actionBtnDisabled
                ]}
                onPress={handleConfirmVerify}
                disabled={!residentFlat || actionProcessing}
                activeOpacity={0.8}
              >
                {actionProcessing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                    <Text style={styles.actionBtnText}>Verified & Check-in</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, actionProcessing && styles.actionBtnDisabled]}
                onPress={handleRejectPass}
                disabled={actionProcessing}
                activeOpacity={0.8}
              >
                <MaterialIcons name="cancel" size={20} color={theme.colors.error} />
                <Text style={styles.rejectBtnText}>Reject / Mismatch Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  verificationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  verificationModalContent: {
    width: "100%",
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    maxHeight: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  verificationModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  verificationModalTitle: {
    ...theme.typography.headlineMd,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  verificationScroll: {
    padding: 20,
  },
  sectionHeader: {
    ...theme.typography.labelMd,
    fontWeight: "700",
    color: theme.colors.outline,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  verifiedResidentCard: {
    borderColor: "rgba(0, 106, 97, 0.3)",
    backgroundColor: "rgba(0, 106, 97, 0.02)",
  },
  mismatchResidentCard: {
    borderColor: "rgba(186, 26, 26, 0.3)",
    backgroundColor: "rgba(186, 26, 26, 0.02)",
  },
  statusBadgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 106, 97, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  statusBadgeTextSuccess: {
    ...theme.typography.labelMd,
    color: "#006a61",
    fontWeight: "700",
  },
  statusBadgeError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(186, 26, 26, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  statusBadgeTextError: {
    ...theme.typography.labelMd,
    color: theme.colors.error,
    fontWeight: "700",
  },
  mismatchText: {
    ...theme.typography.bodyMd,
    color: theme.colors.error,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoRowDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: 14,
  },
  infoTextContainer: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoVal: {
    ...theme.typography.bodyLg,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  infoSubText: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
    fontSize: 11,
    marginTop: 2,
  },
  designationTag: {
    backgroundColor: theme.colors.secondaryContainer,
    color: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  verifyBtn: {
    backgroundColor: theme.colors.secondary,
  },
  rejectBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    backgroundColor: "transparent",
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
    fontWeight: "700",
  },
  rejectBtnText: {
    ...theme.typography.button,
    color: theme.colors.error,
    fontWeight: "700",
  },
});
