import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme";

interface ProfileRegModalProps {
  visible: boolean;
  isRegistering: boolean;
  onRegister: (data: {
    fullName: string;
    email: string;
    phone: string;
    vehicleNumber: string;
  }) => void;
  onClose: () => void;
}

export const ProfileRegModal: React.FC<ProfileRegModalProps> = ({
  visible,
  isRegistering,
  onRegister,
  onClose,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const handleSubmit = () => {
    Keyboard.dismiss();
    onRegister({ fullName, email, phone, vehicleNumber });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guest Registration</Text>
            <Text style={styles.modalSubtitle}>
              Create your HomeCircle Guest profile to generate visitor passes and receive security notifications.
            </Text>
          </View>

          <View style={styles.modalForm}>
            <View style={styles.modalInputWrapper}>
              <MaterialIcons name="person" size={20} color={theme.colors.outline} style={styles.modalIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name *"
                placeholderTextColor={theme.colors.outline}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <MaterialIcons name="mail" size={20} color={theme.colors.outline} style={styles.modalIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Email Address *"
                placeholderTextColor={theme.colors.outline}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <MaterialIcons name="phone" size={20} color={theme.colors.outline} style={styles.modalIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Phone Number *"
                placeholderTextColor={theme.colors.outline}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <MaterialIcons name="directions-car" size={20} color={theme.colors.outline} style={styles.modalIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Vehicle Number (Optional)"
                placeholderTextColor={theme.colors.outline}
                autoCapitalize="characters"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isRegistering}
          >
            {isRegistering ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.modalSaveButtonText}>Register Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalLaterButton}
            onPress={onClose}
            activeOpacity={0.8}
            disabled={isRegistering}
          >
            <Text style={styles.modalLaterButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  modalSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  modalForm: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  modalIcon: {
    marginRight: theme.spacing.sm,
  },
  modalInput: {
    flex: 1,
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    height: "100%",
  },
  modalSaveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveButtonText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
    fontSize: 15,
  },
  modalLaterButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  modalLaterButtonText: {
    ...theme.typography.button,
    color: theme.colors.onSurfaceVariant,
    fontSize: 15,
  },
});
