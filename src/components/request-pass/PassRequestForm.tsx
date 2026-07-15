import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";

interface PassRequestFormProps {
  isPending: boolean;
  onSubmit: (data: {
    visitorName: string;
    visitorEmail: string;
    visitorPhone: string;
    visitorDesignation: string;
    towerNo: string;
    flatNo: string;
    expiryHours: number;
    afterScanExpiry: string;
  }) => void;
}

export const PassRequestForm: React.FC<PassRequestFormProps> = ({
  isPending,
  onSubmit,
}) => {
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorDesignation, setVisitorDesignation] = useState("Delivery");
  const [towerNo, setTowerNo] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [expiryHours, setExpiryHours] = useState(24);
  const [afterScanExpiry, setAfterScanExpiry] = useState("Instant");

  const handleSubmit = () => {
    onSubmit({
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorDesignation,
      towerNo,
      flatNo,
      expiryHours,
      afterScanExpiry,
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

      {/* Designation Chips */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>DESIGNATION</Text>
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
        <Text style={styles.sectionLabel}>PASS VALIDITY (EXPIRY)</Text>
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

      {/* Destination */}
      <View style={styles.formSection}>
        <Text style={styles.sectionLabel}>DESTINATION</Text>
        
        <View style={[styles.inputContainer, styles.inputContainerDisabled]}>
          <MaterialIcons name="domain" size={20} color={theme.colors.outline} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, styles.textInputDisabled]}
            value="Greenwood Heights (GH001)"
            editable={false}
          />
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
            <MaterialIcons name="apartment" size={20} color={theme.colors.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Tower No."
              placeholderTextColor={theme.colors.outline}
              value={towerNo}
              onChangeText={setTowerNo}
            />
          </View>

          <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }]}>
            <MaterialIcons name="meeting-room" size={20} color={theme.colors.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Flat No."
              placeholderTextColor={theme.colors.outline}
              value={flatNo}
              onChangeText={setFlatNo}
            />
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
  inputContainerDisabled: {
    backgroundColor: theme.colors.surfaceContainerLow,
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
  textInputDisabled: {
    color: theme.colors.onSurfaceVariant,
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
