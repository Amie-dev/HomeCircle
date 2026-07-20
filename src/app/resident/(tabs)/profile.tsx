import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../../utils/supabase";
import { useRequestResidentVerify } from "../../../hooks/useRequestResident";
import { useProfileStore } from "../../../store/useProfileStore";
import { theme } from "../../../theme";
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, clearProfile } = useProfileStore();

  // Settings State
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Dynamic DB States
  const [duesAmount, setDuesAmount] = useState(0);
  const [household, setHousehold] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isFlatAdmin, setIsFlatAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [societyDetails, setSocietyDetails] = useState<any | null>(null);

  const { mutateAsync: requestResidentVerify } = useRequestResidentVerify();

  // Join Society Modal States
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [societyQuery, setSocietyQuery] = useState("");
  const [towerQuery, setTowerQuery] = useState("");
  const [flatQuery, setFlatQuery] = useState("");

  const [validatingSociety, setValidatingSociety] = useState(false);
  const [societyData, setSocietyData] = useState<any | null>(null);
  const [societyError, setSocietyError] = useState<string | null>(null);

  const [validatingTower, setValidatingTower] = useState(false);
  const [towerData, setTowerData] = useState<any | null>(null);
  const [towerError, setTowerError] = useState<string | null>(null);

  const [validatingFlat, setValidatingFlat] = useState(false);
  const [flatData, setFlatData] = useState<any | null>(null);
  const [flatError, setFlatError] = useState<string | null>(null);
  const [isOccupied, setIsOccupied] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);

  const fetchProfileData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);

      // Fetch society details
      if (profile?.societyId) {
        const { data: socData } = await supabase
          .from("societies")
          .select("*")
          .eq("id", profile.societyId)
          .maybeSingle();
        if (socData) {
          setSocietyDetails(socData);
        }
      }
      // 1. Get flat_id and flats(flat_admin_id) to query dues
      const { data: memberData } = await supabase
        .from("societymembers")
        .select(`
          flat_id,
          flats (
            flat_admin_id
          )
        `)
        .eq("user_id", profile.id)
        .maybeSingle();

      const flatAdminId = (memberData?.flats as any)?.flat_admin_id || profile.id;
      const isAdmin = flatAdminId === profile.id;
      setIsFlatAdmin(isAdmin);

      if (memberData?.flat_id) {
        const { data: invoices } = await supabase
          .from("maintenance_invoices")
          .select("amount")
          .eq("flat_id", memberData.flat_id)
          .eq("status", "Pending");

        if (invoices) {
          const sum = invoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
          setDuesAmount(sum);
        }
      }

      // 2. Query household members for the flat (using flatAdminId)
      const { data: householdData } = await supabase
        .from("household_members")
        .select("*")
        .eq("user_id", flatAdminId);

      if (householdData) {
        setHousehold(householdData);
      }

      // 3. Query vehicles for the flat (using flatAdminId)
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", flatAdminId);

      if (vehiclesData) {
        setVehicles(vehiclesData);
      }
    } catch (err) {
      console.error("Error loading profile DB data:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        fetchProfileData();
      }
    }, [profile?.id])
  );

  // 1. Debounced Society Check
  useEffect(() => {
    if (societyQuery.trim().length < 3) {
      setSocietyData(null);
      setSocietyError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingSociety(true);
      setSocietyError(null);
      try {
        const query = societyQuery.trim();
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(query);

        let selectQuery = supabase.from("societies").select("*");
        if (isUuid) {
          selectQuery = selectQuery.eq("id", query);
        } else {
          selectQuery = selectQuery.or(`society_id.eq."${query.toLowerCase()}",name.ilike."%${query}%"`);
        }

        const { data, error } = await selectQuery.maybeSingle();

        if (error) throw error;

        if (data) {
          setSocietyData(data);
          setSocietyError(null);
        } else {
          setSocietyData(null);
          setSocietyError("Invalid society name or unique ID code.");
        }
      } catch (err: any) {
        console.warn("Society lookup failed:", err.message);
        setSocietyError("Lookup failed. Please verify connection.");
      } finally {
        setValidatingSociety(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [societyQuery]);

  // 2. Debounced Tower Check
  useEffect(() => {
    if (!societyData || towerQuery.trim().length === 0) {
      setTowerData(null);
      setTowerError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingTower(true);
      setTowerError(null);
      try {
        const { data, error } = await supabase
          .from("towers")
          .select("*")
          .eq("society_id", societyData.id)
          .or(`name.ilike."${towerQuery.trim()}",tower_id.ilike."${towerQuery.trim()}"`)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setTowerData(data);
          setTowerError(null);
        } else {
          setTowerData(null);
          setTowerError("Tower/Block does not exist in this society.");
        }
      } catch (err: any) {
        console.warn("Tower lookup failed:", err.message);
        setTowerError("Database validation failed.");
      } finally {
        setValidatingTower(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [towerQuery, societyData]);

  // 3. Debounced Flat Check
  useEffect(() => {
    if (!towerData || flatQuery.trim().length === 0) {
      setFlatData(null);
      setFlatError(null);
      setIsOccupied(false);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingFlat(true);
      setFlatError(null);
      setIsOccupied(false);
      try {
        const { data, error } = await supabase
          .from("flats")
          .select("*")
          .eq("tower_id", towerData.id)
          .eq("flat_number", flatQuery.trim())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          if (data.status && data.status !== "Vacant") {
            setIsOccupied(true);
            setFlatData(null);
            setFlatError("This flat is already occupied. Choose another flat.");
          } else {
            setIsOccupied(false);
            setFlatData(data);
            setFlatError(null);
          }
        } else {
          setFlatData(null);
          setIsOccupied(false);
          setFlatError("Flat number does not exist in this tower.");
        }
      } catch (err: any) {
        console.warn("Flat lookup failed:", err.message);
        setFlatError("Database validation failed.");
        setIsOccupied(false);
      } finally {
        setValidatingFlat(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [flatQuery, towerData]);

  const handleJoinSubmit = async () => {
    if (!profile) return;

    if (isOccupied) {
      Alert.alert("Flat Occupied ⚠️", "The selected flat is already occupied. Please choose another flat.");
      return;
    }

    if (!societyData || !towerData || !flatData) {
      Alert.alert("Selection Incomplete", "Please wait for validation to complete or verify all inputs.");
      return;
    }

    setSubmittingJoin(true);
    try {
      // 1. Submit verification request
      await requestResidentVerify({
        userId: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        societyId: societyData.id,
        towerId: towerData.id,
        flatId: flatData.id,
        societyName: societyData.name,
        towerName: towerData.name,
        flatNumber: flatData.flat_number,
      });

      // 2. Notify society admin of new resident registration
      try {
        const { data: adminMember } = await supabase
          .from("societymembers")
          .select("user_id")
          .eq("society_id", societyData.id)
          .eq("role", "Admin")
          .maybeSingle();

        if (adminMember?.user_id) {
          const { data: userData } = await supabase
            .from("users")
            .select("notification_token")
            .eq("id", adminMember.user_id)
            .maybeSingle();

          const notifTitle = "New Resident Registration 🔔";
          const notifBody = `${profile.fullName} is requesting access to unit ${towerData.name}-${flatData.flat_number}.`;

          if (userData?.notification_token) {
            const { sendPushNotification } = require("../../../../utils/notificationService");
            await sendPushNotification({
              token: userData.notification_token,
              title: notifTitle,
              body: notifBody,
              data: {
                screen: "/admin/residents",
                url: "/admin/residents",
              },
            });
          }

          await supabase.from("push_notifications").insert({
            user_id: adminMember.user_id,
            title: notifTitle,
            body: notifBody,
            screen: "/admin/residents",
            status: "Sent",
          });
        }
      } catch (notifErr) {
        console.warn("Failed to notify admin of registration request:", notifErr);
      }

      // 3. Update local user profile state in Zustand
      await useProfileStore.getState().setProfile({
        ...profile,
        societyId: societyData.id,
        societyName: societyData.name,
        towerName: towerData.name,
        flatName: flatData.flat_number,
        isVerified: false,
      });

      // 4. Refresh page data
      await fetchProfileData();

      Alert.alert(
        "Verification Submitted",
        `Your verification request has been sent to ${societyData.name} Admin. Once verified, you will gain full access.`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowJoinModal(false);
              // Clean form fields
              setSocietyQuery("");
              setTowerQuery("");
              setFlatQuery("");
              setSocietyData(null);
              setTowerData(null);
              setFlatData(null);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error registering", err.message || "Failed to complete details.");
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearProfile();
          router.replace("/get-started" as any);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePayBills = () => {
    router.push("/resident/(home)/dues" as any);
  };

  const handleAddVehicle = () => {
    router.push({
      pathname: "/resident/(setting)/add-vehicle",
      params: { isFlatAdmin: isFlatAdmin ? "true" : "false" },
    } as any);
  };

  const handleAddHousehold = () => {
    router.push({
      pathname: "/resident/(setting)/household-members",
      params: { isFlatAdmin: isFlatAdmin ? "true" : "false" },
    } as any);
  };

  const handleChangePassword = () => {
    Alert.alert("Change Password", "A password reset link has been sent to your registered email address.");
  };

  const handleCallEmergency = () => {
    Alert.alert("Call Security", "Do you want to call Society Security (+91 99999 88888)?", [
      { text: "Call", onPress: () => Alert.alert("Dialing...", "Dialing Society Security...") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (!profile) return null;

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="dark" />

      {/* Top App Bar Header */}
      <View style={[styles.topAppBar, { paddingTop: insets.top }]}>
        <View style={styles.topAppBarLeft}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="grid-view" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchProfileData}>
          <MaterialIcons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* User Header Section */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=0D9488&color=fff&size=100` }}
              style={styles.largeAvatar}
            />
            {profile.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={14} color="#ffffff" />
              </View>
            )}
          </View>
          <View style={styles.profileMainInfo}>
            <Text style={styles.profileNameText}>{profile.fullName}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.locationText}>
                {profile.towerName || "Block C"}, Unit {profile.flatName || "402"}
              </Text>
            </View>
            <View style={styles.roleLabelWrapper}>
              <Text style={styles.roleLabelText}>{profile.role || "Resident"}</Text>
            </View>
          </View>
        </View>

        {/* Bento Grid Info */}
        <View style={styles.bentoRow}>
          {/* Security Status */}
          <View style={styles.securityStatusCard}>
            <View style={styles.securityTextGroup}>
              <Text style={styles.bentoLabel}>Security Status</Text>
              <Text style={styles.bentoValue}>Safe</Text>
            </View>
            <View style={styles.securityStatusBadge}>
              <MaterialIcons name="check-circle" size={14} color={theme.colors.secondaryContainer} />
              <Text style={styles.securityStatusText}>All clear</Text>
            </View>
            <MaterialIcons name="shield" size={64} color="rgba(255,255,255,0.06)" style={styles.shieldBgIcon} />
          </View>

          {/* Unit Balance */}
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.bentoLabelDark}>Unit Balance</Text>
              <Text style={styles.bentoValueDark}>
                ₹{duesAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <TouchableOpacity style={styles.payBillsBtn} onPress={handlePayBills}>
              <Text style={styles.payBillsText}>Pay Bills</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Society Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOCIETY DETAILS</Text>
          {profile.societyId ? (
            <View style={styles.cardContainer}>
              <View style={styles.menuRow}>
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconBox, { backgroundColor: "rgba(13, 148, 136, 0.1)" }]}>
                    <MaterialIcons name="apartment" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuTitle}>{societyDetails?.name || profile.societyName}</Text>
                    <Text style={styles.menuSubtitle}>
                      {societyDetails?.address ? `${societyDetails.address}, ${societyDetails.city || ""}` : "Verified Society"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.gridRowDetail}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailItemLabel}>Tower/Block</Text>
                  <Text style={styles.detailItemValue}>{profile.towerName || "N/A"}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailItemLabel}>Flat/Unit No</Text>
                  <Text style={styles.detailItemValue}>{profile.flatName || "N/A"}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.cardContainer, { padding: theme.spacing.md, alignItems: "center", gap: theme.spacing.sm }]}>
              <MaterialIcons name="business" size={40} color={theme.colors.outline} />
              <Text style={[styles.menuTitle, { textAlign: "center" }]}>No Society Joined Yet</Text>
              <Text style={[styles.menuSubtitle, { textAlign: "center", paddingHorizontal: theme.spacing.md }]}>
                Join a society to connect with neighbors, pay dues, check visitor logs and book amenities.
              </Text>
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => setShowJoinModal(true)}
              >
                <Text style={styles.joinBtnText}>Join a Society</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My Unit Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY UNIT</Text>
          <View style={styles.cardContainer}>
            {/* Household Members */}
            <View style={styles.unitRow}>
              <View style={styles.rowLeftHeader}>
                <MaterialIcons name="people" size={22} color={theme.colors.secondary} />
                <Text style={styles.unitRowTitle}>Household Members ({household.length})</Text>
              </View>
              <TouchableOpacity onPress={handleAddHousehold}>
                <Text style={styles.actionBtnText}>Manage</Text>
              </TouchableOpacity>
            </View>

            {household.length > 0 ? (
              <View style={styles.householdList}>
                {household.map((member) => (
                  <View key={member.id} style={styles.memberCard}>
                    <Image
                      source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random&color=fff&size=40` }}
                      style={styles.memberAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.memberNameText}>{member.full_name}</Text>
                      <Text style={styles.memberRoleText}>{member.relationship} • {member.phone}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No registered household family members.</Text>
            )}

            <View style={styles.divider} />

            {/* Registered Vehicles */}
            <View style={styles.unitRow}>
              <View style={styles.rowLeftHeader}>
                <MaterialIcons name="directions-car" size={22} color={theme.colors.secondary} />
                <Text style={styles.unitRowTitle}>Registered Vehicles ({vehicles.length})</Text>
              </View>
              <TouchableOpacity onPress={handleAddVehicle}>
                <Text style={styles.actionBtnText}>Manage</Text>
              </TouchableOpacity>
            </View>

            {vehicles.length > 0 ? (
              <View style={styles.vehiclesList}>
                {vehicles.map((v) => (
                  <View key={v.id} style={styles.vehicleCard}>
                    <View style={styles.vehicleDetails}>
                      <View style={styles.vehicleIconWrapper}>
                        <MaterialIcons name="directions-car" size={20} color={theme.colors.secondary} />
                      </View>
                      <View>
                        <Text style={styles.vehicleName}>{v.vehicle_name}</Text>
                        <Text style={styles.vehicleNumber}>{v.vehicle_number}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="verified" size={20} color={theme.colors.secondary} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No registered vehicles.</Text>
            )}
          </View>
        </View>

        {/* Account Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT SECURITY</Text>
          <View style={styles.cardContainer}>
            {/* Change Password */}
            <TouchableOpacity style={styles.menuRow} onPress={handleChangePassword}>
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: "rgba(19, 27, 46, 0.05)" }]}>
                  <MaterialIcons name="lock-open" size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuTitle}>Change Password</Text>
                  <Text style={styles.menuSubtitle}>Update your login credentials</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.outline} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Biometric Login */}
            <View style={styles.menuRowNoTouch}>
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: "rgba(19, 27, 46, 0.05)" }]}>
                  <MaterialIcons name="fingerprint" size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuTitle}>Biometric Login</Text>
                  <Text style={styles.menuSubtitle}>Use FaceID or Fingerprint</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.cardContainer}>
            {/* Push Notifications */}
            <View style={styles.notificationToggleRow}>
              <View style={styles.notifLabelRow}>
                <MaterialIcons name="notifications" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.notifLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.divider} />

            {/* WhatsApp Updates */}
            <View style={styles.notificationToggleRow}>
              <View style={styles.notifLabelRow}>
                <MaterialIcons name="chat" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.notifLabel}>WhatsApp Updates</Text>
              </View>
              <Switch
                value={whatsappEnabled}
                onValueChange={setWhatsappEnabled}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.divider} />

            {/* Email Reports */}
            <View style={styles.notificationToggleRow}>
              <View style={styles.notifLabelRow}>
                <MaterialIcons name="mail" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.notifLabel}>Email Reports</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>EMERGENCY CONTACTS</Text>
          </View>
          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.emergencyCard} onPress={handleCallEmergency}>
              <View style={styles.emergencyLeft}>
                <View style={styles.emergencyIconBox}>
                  <MaterialIcons name="call" size={20} color={theme.colors.error} />
                </View>
                <View>
                  <Text style={styles.emergencyTitle}>Society Security</Text>
                  <Text style={styles.emergencyPhone}>+91 99999 88888</Text>
                </View>
              </View>
              <MaterialIcons name="emergency" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.supportRow} onPress={() => Alert.alert("Help Center", "Opening help documentation...")}>
              <MaterialIcons name="help" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.supportRowText}>Help Center</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.supportRow} onPress={() => Alert.alert("Terms of Service", "Opening Terms & Privacy document...")}>
              <MaterialIcons name="description" size={20} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.supportRowText}>Terms of Service</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.supportRow} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={theme.colors.error} />
              <Text style={[styles.supportRowText, { color: theme.colors.error, fontWeight: "600" }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>
          HomeCircle v2.4.0 • Built with Trust
        </Text>
      </ScrollView>

      {/* Join Society Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join a Society</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Society Input */}
              <View style={styles.modalInputWrapper}>
                <Text style={styles.modalInputLabel}>SOCIETY NAME OR UNIQUE CODE</Text>
                <View
                  style={[
                    styles.modalInputBox,
                    societyError ? styles.inputBoxError : societyData ? styles.inputBoxSuccess : null,
                  ]}
                >
                  <MaterialIcons name="apartment" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Search society name or enter code"
                    placeholderTextColor={theme.colors.outline}
                    value={societyQuery}
                    onChangeText={setSocietyQuery}
                    autoCapitalize="words"
                  />
                  {validatingSociety && <ActivityIndicator size="small" color={theme.colors.secondary} />}
                  {!validatingSociety && societyData && (
                    <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
                  )}
                  {!validatingSociety && societyError && (
                    <MaterialIcons name="error" size={20} color={theme.colors.error} />
                  )}
                </View>
                {societyError && <Text style={styles.modalErrorText}>{societyError}</Text>}
                {!societyError && societyData && (
                  <Text style={styles.modalSuccessText}>
                    ✓ Verified: {societyData.name} ({societyData.society_id ? societyData.society_id.toUpperCase() : "No Code"})
                  </Text>
                )}
              </View>

              {/* Tower Input */}
              <View style={styles.modalInputWrapper}>
                <Text style={styles.modalInputLabel}>TOWER / BLOCK</Text>
                <View
                  style={[
                    styles.modalInputBox,
                    towerError ? styles.inputBoxError : towerData ? styles.inputBoxSuccess : null,
                    !societyData && styles.inputBoxDisabled,
                  ]}
                >
                  <MaterialIcons name="domain" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. Block C"
                    placeholderTextColor={theme.colors.outline}
                    value={towerQuery}
                    onChangeText={setTowerQuery}
                    editable={!!societyData}
                  />
                  {validatingTower && <ActivityIndicator size="small" color={theme.colors.secondary} />}
                  {!validatingTower && towerData && (
                    <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
                  )}
                </View>
                {towerError && <Text style={styles.modalErrorText}>{towerError}</Text>}
              </View>

              {/* Flat Input */}
              <View style={styles.modalInputWrapper}>
                <Text style={styles.modalInputLabel}>FLAT NUMBER</Text>
                <View
                  style={[
                    styles.modalInputBox,
                    flatError ? styles.inputBoxError : flatData ? styles.inputBoxSuccess : null,
                    !towerData && styles.inputBoxDisabled,
                  ]}
                >
                  <MaterialIcons name="door-front" size={20} color={theme.colors.outline} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. 402"
                    placeholderTextColor={theme.colors.outline}
                    value={flatQuery}
                    onChangeText={setFlatQuery}
                    editable={!!towerData}
                  />
                  {validatingFlat && <ActivityIndicator size="small" color={theme.colors.secondary} />}
                  {!validatingFlat && flatData && (
                    <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
                  )}
                </View>
                {flatError && <Text style={styles.modalErrorText}>{flatError}</Text>}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: flatData ? theme.colors.primary : theme.colors.outline }]}
                disabled={submittingJoin || !flatData}
                onPress={handleJoinSubmit}
              >
                {submittingJoin ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingTop: 96,
    paddingBottom: 40,
    gap: theme.spacing.lg,
  },
  profileHeaderCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "rgba(15, 23, 42, 0.04)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  avatarContainer: {
    position: "relative",
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.secondary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  profileMainInfo: {
    marginLeft: 16,
    flex: 1,
    gap: 4,
  },
  profileNameText: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  roleLabelWrapper: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,106,97,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  roleLabelText: {
    ...theme.typography.labelMd,
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  bentoRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  securityStatusCard: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: theme.spacing.md,
    height: 128,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  securityTextGroup: {
    zIndex: 2,
  },
  bentoLabel: {
    ...theme.typography.labelMd,
    color: "rgba(255, 255, 255, 0.6)",
  },
  bentoValue: {
    ...theme.typography.headlineMd,
    color: "#ffffff",
    marginTop: 4,
  },
  securityStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 2,
  },
  securityStatusText: {
    ...theme.typography.labelMd,
    color: theme.colors.secondaryContainer,
  },
  shieldBgIcon: {
    position: "absolute",
    right: -12,
    bottom: -12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: theme.spacing.md,
    height: 128,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  bentoLabelDark: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  bentoValueDark: {
    ...theme.typography.headlineMd,
    color: theme.colors.primary,
    marginTop: 4,
  },
  payBillsBtn: {
    width: "100%",
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,106,97,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  payBillsText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
    fontSize: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardContainer: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.3)",
    overflow: "hidden",
  },
  unitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  rowLeftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unitRowTitle: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  actionBtnText: {
    ...theme.typography.button,
    color: theme.colors.secondary,
  },
  householdAvatarsRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(198, 198, 205, 0.2)",
  },
  vehicleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(198, 198, 205, 0.2)",
  },
  vehicleDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  vehicleName: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  vehicleNumber: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  menuRowNoTouch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
    fontWeight: "500",
  },
  menuSubtitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  notificationToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  notifLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notifLabel: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
  },
  emergencyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: "rgba(186, 26, 26, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.1)",
    borderRadius: 12,
    margin: theme.spacing.md,
  },
  emergencyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emergencyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyTitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    fontWeight: "700",
  },
  emergencyPhone: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: theme.spacing.md,
  },
  supportRowText: {
    ...theme.typography.bodyLg,
    color: theme.colors.onSurface,
  },
  versionText: {
    ...theme.typography.labelMd,
    color: theme.colors.outlineVariant,
    textAlign: "center",
    paddingVertical: 16,
  },
  householdList: {
    padding: theme.spacing.md,
    gap: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: 8,
  },
  memberNameText: {
    ...theme.typography.button,
    color: theme.colors.onSurface,
    fontWeight: "700",
  },
  memberRoleText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  vehiclesList: {
    padding: theme.spacing.md,
    gap: 10,
  },
  emptyText: {
    ...theme.typography.bodyMd,
    color: theme.colors.outline,
    padding: theme.spacing.md,
    textAlign: "center",
  },
  gridRowDetail: {
    flexDirection: "row",
    padding: theme.spacing.md,
    justifyContent: "space-between",
  },
  detailItem: {
    flex: 1,
    gap: 4,
  },
  detailItemLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.outline,
  },
  detailItemValue: {
    ...theme.typography.bodyLg,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  joinBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.rounded.md,
    marginTop: theme.spacing.sm,
    width: "100%",
    alignItems: "center",
  },
  joinBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
    fontWeight: "700",
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
  modalScrollBody: {
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  modalInputWrapper: {
    gap: theme.spacing.xs,
  },
  modalInputLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
  },
  modalInputBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.rounded.default,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  modalTextInput: {
    flex: 1,
    color: theme.colors.onSurface,
    ...theme.typography.bodyLg,
    marginLeft: 8,
  },
  modalErrorText: {
    ...theme.typography.labelMd,
    color: theme.colors.error,
  },
  modalSuccessText: {
    ...theme.typography.labelMd,
    color: "#2e7d32",
  },
  modalFooter: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingBottom: Platform.OS === "ios" ? 16 : 0,
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.rounded.default,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    ...theme.typography.button,
    color: "#ffffff",
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
  inputBoxError: {
    borderColor: theme.colors.error,
  },
  inputBoxSuccess: {
    borderColor: "#2e7d32",
  },
  inputBoxDisabled: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.outlineVariant,
    opacity: 0.6,
  },
  inputIcon: {
    marginRight: 4,
  },
});
