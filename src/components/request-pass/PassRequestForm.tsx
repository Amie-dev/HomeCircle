import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { theme } from "../../theme";
import { supabase } from "../../../utils/supabase";

interface PassRequestFormProps {
  isPending: boolean;
  guestProfile: any | null;
  onSubmit: (data: {
    visitorName: string;
    visitorEmail: string;
    visitorPhone: string;
    visitorDesignation: string;
    towerNo: string;
    flatNo: string;
    expiryHours: number;
    afterScanExpiry: string;
    societyId?: string;
    societyName?: string;
  }) => void;
}

export const PassRequestForm: React.FC<PassRequestFormProps> = ({
  isPending,
  guestProfile,
  onSubmit,
}) => {
  // Visitor info state
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorDesignation, setVisitorDesignation] = useState("Delivery");

  // Options state
  const [expiryHours, setExpiryHours] = useState(24);
  const [afterScanExpiry, setAfterScanExpiry] = useState("Instant");

  // Destination Verification state
  const [societyQuery, setSocietyQuery] = useState("");
  const [validatingSociety, setValidatingSociety] = useState(false);
  const [societyData, setSocietyData] = useState<any | null>(null);
  const [societyError, setSocietyError] = useState<string | null>(null);

  const [towerQuery, setTowerQuery] = useState("");
  const [validatingTower, setValidatingTower] = useState(false);
  const [towerData, setTowerData] = useState<any | null>(null);
  const [towerError, setTowerError] = useState<string | null>(null);

  const [flatQuery, setFlatQuery] = useState("");
  const [validatingFlat, setValidatingFlat] = useState(false);
  const [flatData, setFlatData] = useState<any | null>(null);
  const [flatError, setFlatError] = useState<string | null>(null);

  // 1. Default visitor fields if guest session exists
  useEffect(() => {
    if (guestProfile) {
      setVisitorName(guestProfile.fullName || "");
      setVisitorEmail(guestProfile.email || "");
      setVisitorPhone(guestProfile.phone || "");

      // If registered resident profile, also pre-fill destination details!
      if (guestProfile.societyName) {
        setSocietyQuery(guestProfile.societyName);
      }
      if (guestProfile.towerName) {
        setTowerQuery(guestProfile.towerName);
      }
      if (guestProfile.flatName) {
        setFlatQuery(guestProfile.flatName);
      }
    }
  }, [guestProfile]);

  // 2. Debounced Society Check
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
          selectQuery = selectQuery.or(`society_id.eq.${query.toLowerCase()},name.ilike.%${query}%`);
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
        setSocietyError("Database lookup warning.");
      } finally {
        setValidatingSociety(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [societyQuery]);

  // 3. Debounced Tower Check
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
          .ilike("name", towerQuery.trim())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setTowerData(data);
          setTowerError(null);
        } else {
          setTowerData(null);
          setTowerError("Tower/Block not found in this society.");
        }
      } catch (err: any) {
        console.warn("Tower lookup failed:", err.message);
        setTowerError("Database lookup warning.");
      } finally {
        setValidatingTower(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [towerQuery, societyData]);

  // 4. Debounced Flat Check
  useEffect(() => {
    if (!towerData || flatQuery.trim().length === 0) {
      setFlatData(null);
      setFlatError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingFlat(true);
      setFlatError(null);
      try {
        const { data, error } = await supabase
          .from("flats")
          .select("*")
          .eq("tower_id", towerData.id)
          .eq("flat_number", flatQuery.trim())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setFlatData(data);
          setFlatError(null);
        } else {
          setFlatData(null);
          setFlatError("Flat number not found in this tower.");
        }
      } catch (err: any) {
        console.warn("Flat lookup failed:", err.message);
        setFlatError("Database lookup warning.");
      } finally {
        setValidatingFlat(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [flatQuery, towerData]);

  const handleSubmit = () => {
    if (!visitorName || !visitorEmail || !visitorPhone) {
      Alert.alert("Missing Fields", "Please complete all visitor profile fields.");
      return;
    }

    // Require destination mapping
    if (!societyQuery || !towerQuery || !flatQuery) {
      Alert.alert("Destination Error", "Please provide society, tower, and flat destinations.");
      return;
    }

    onSubmit({
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorDesignation,
      towerNo: towerQuery,
      flatNo: flatQuery,
      expiryHours,
      afterScanExpiry,
      societyId: societyData?.id || undefined,
      societyName: societyData?.name || societyQuery,
    });
  };

  return (
    <View style={styles.formContainer}>
      {/* Visitor Details */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>VISITOR DETAILS</Text>
        
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={20} color={theme.colors.outline} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Full Name"
            placeholderTextColor={theme.colors.outline}
            value={visitorName}
            onChangeText={setVisitorName}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="alternate-email" size={20} color={theme.colors.outline} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Email Address"
            placeholderTextColor={theme.colors.outline}
            keyboardType="email-address"
            autoCapitalize="none"
            value={visitorEmail}
            onChangeText={setVisitorEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="phone-iphone" size={20} color={theme.colors.outline} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Phone Number"
            placeholderTextColor={theme.colors.outline}
            keyboardType="phone-pad"
            value={visitorPhone}
            onChangeText={setVisitorPhone}
          />
        </View>
      </View>

      {/* Designation chips */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>PURPOSE / DESIGNATION</Text>
        <View style={styles.chipsRow}>
          {["Delivery", "Service", "Guest", "Friend", "Family"].map((item) => {
            const isSelected = visitorDesignation === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setVisitorDesignation(item)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Expiry Hours Selection */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>PASS VALIDITY (HOURS)</Text>
        <View style={styles.chipsRow}>
          {[2, 4, 8, 12, 24, 48].map((hours) => {
            const isSelected = expiryHours === hours;
            return (
              <TouchableOpacity
                key={hours}
                onPress={() => setExpiryHours(hours)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {hours} hrs
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* After Scan Expiry Selection */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>AFTER-SCAN QR VALIDITY</Text>
        <View style={styles.chipsRow}>
          {["Instant", "15m", "30m", "1h", "2h"].map((item) => {
            const isSelected = afterScanExpiry === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setAfterScanExpiry(item)}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Destination Selection */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>DESTINATION SOCIETY</Text>
        
        {/* Society Search Input */}
        <View
          style={[
            styles.inputContainer,
            societyError ? styles.inputBoxError : societyData ? styles.inputBoxSuccess : null,
          ]}
        >
          <MaterialIcons name="domain" size={20} color={theme.colors.outline} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Search Society Name or ID"
            placeholderTextColor={theme.colors.outline}
            value={societyQuery}
            onChangeText={setSocietyQuery}
          />
          {validatingSociety && <ActivityIndicator size="small" color={theme.colors.secondary} />}
          {!validatingSociety && societyData && (
            <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
          )}
        </View>
        {societyError && <Text style={styles.errorText}>{societyError}</Text>}
        {!societyError && societyData && (
          <Text style={styles.successText}>
            ✓ Verified: {societyData.name} ({societyData.society_id ? societyData.society_id.toUpperCase() : "No Code"})
          </Text>
        )}

        <View style={styles.gridRow}>
          {/* Tower/Block input */}
          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.inputContainer,
                { marginBottom: 0 },
                towerError ? styles.inputBoxError : towerData ? styles.inputBoxSuccess : null,
              ]}
            >
              <MaterialIcons name="apartment" size={20} color={theme.colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Tower No."
                placeholderTextColor={theme.colors.outline}
                value={towerQuery}
                onChangeText={setTowerQuery}
                editable={!!societyData}
              />
              {validatingTower && <ActivityIndicator size="small" color={theme.colors.secondary} />}
              {!validatingTower && towerData && (
                <MaterialIcons name="check-circle" size={16} color="#2e7d32" />
              )}
            </View>
            {towerError && <Text style={[styles.errorText, { marginTop: 4 }]}>{towerError}</Text>}
          </View>

          {/* Flat input */}
          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.inputContainer,
                { marginBottom: 0 },
                flatError ? styles.inputBoxError : flatData ? styles.inputBoxSuccess : null,
              ]}
            >
              <MaterialIcons name="meeting-room" size={20} color={theme.colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Flat No."
                placeholderTextColor={theme.colors.outline}
                value={flatQuery}
                onChangeText={setFlatQuery}
                editable={!!towerData}
              />
              {validatingFlat && <ActivityIndicator size="small" color={theme.colors.secondary} />}
              {!validatingFlat && flatData && (
                <MaterialIcons name="check-circle" size={16} color="#2e7d32" />
              )}
            </View>
            {flatError && <Text style={[styles.errorText, { marginTop: 4 }]}>{flatError}</Text>}
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitButton}
        activeOpacity={0.9}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <MaterialIcons name="send" size={18} color="#ffffff" />
            <Text style={styles.submitButtonText}>Request Pass</Text>
          </>
        )}
      </TouchableOpacity>
      
      <Text style={styles.policyText}>
        By requesting, you agree to our <Text style={styles.policyLink}>Security Policy</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    paddingHorizontal: theme.spacing.containerMarginMobile,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  formSection: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    ...theme.typography.labelMd,
    color: theme.colors.secondary,
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    height: 52,
    marginBottom: theme.spacing.xs,
  },
  inputBoxSuccess: {
    borderColor: "#2e7d32",
  },
  inputBoxError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    ...theme.typography.labelMd,
    color: theme.colors.error,
    paddingHorizontal: 4,
    marginTop: -4,
  },
  successText: {
    ...theme.typography.labelMd,
    color: "#2e7d32",
    paddingHorizontal: 4,
    marginTop: -4,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    height: "100%",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 9999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.secondary,
  },
  chipText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: theme.colors.onSecondaryContainer,
    fontWeight: "700",
  },
  gridRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  submitButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.sm,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: theme.spacing.md,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: theme.colors.onSecondary,
    fontSize: 16,
  },
  policyText: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  policyLink: {
    color: theme.colors.secondary,
    textDecorationLine: "underline",
    fontWeight: "700",
  },
});
