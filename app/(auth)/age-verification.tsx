
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function AgeVerificationScreen() {
  const router = useRouter();
  const { verifyAge, user } = useAuth();

  const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === "ios");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertModal, setAlertModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });

  const showAlert = (title: string, message: string) => {
    setAlertModal({ visible: true, title, message });
  };

  const hideAlert = () => {
    setAlertModal({ visible: false, title: "", message: "" });
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleVerifyAge = async () => {
    const age = calculateAge(birthDate);
    
    if (age < 13) {
      setError("You must be at least 13 years old to use NumSnap Daily.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifyAge(age);
      console.log("[AgeVerification] Age verified successfully");
      
      showAlert(
        "Welcome! 🎉",
        "Your age has been verified. You can now start playing NumSnap Daily!"
      );
      
      // Redirect to home after a moment
      setTimeout(() => {
        router.replace("/(tabs)/(home)/");
      }, 2000);
    } catch (err: any) {
      console.error("[AgeVerification] Error:", err);
      setError(err.message || "Age verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setBirthDate(selectedDate);
      setError("");
    }
  };

  const ageDisplay = calculateAge(birthDate);
  const dateDisplay = birthDate.toLocaleDateString();

  return (
    <LinearGradient
      colors={["#1E3A8A", "#3B82F6", "#60A5FA"]}
      style={styles.container}
    >
      {/* Alert Modal */}
      <Modal
        visible={alertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{alertModal.title}</Text>
            <Text style={styles.modalMessage}>{alertModal.message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={hideAlert}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.logo}>🎂</Text>
          <Text style={styles.title}>Age Verification</Text>
          <Text style={styles.subtitle}>
            To comply with regulations, we need to verify your age.
          </Text>

          {user?.email ? (
            <Text style={styles.userEmail}>Signed in as: {user.email}</Text>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.dateSection}>
            <Text style={styles.label}>Select your birth date:</Text>
            
            {Platform.OS === "android" && !showDatePicker && (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>{dateDisplay}</Text>
              </TouchableOpacity>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                style={styles.datePicker}
              />
            )}

            <View style={styles.ageDisplay}>
              <Text style={styles.ageLabel}>Your age:</Text>
              <Text style={styles.ageValue}>{ageDisplay} years old</Text>
            </View>

            {ageDisplay < 13 && (
              <Text style={styles.warningText}>
                You must be at least 13 years old to use this app.
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (loading || ageDisplay < 13) && styles.buttonDisabled]}
            onPress={handleVerifyAge}
            disabled={loading || ageDisplay < 13}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify Age & Continue</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.privacyNote}>
            Your birth date is used only for age verification and is stored securely.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  logo: {
    fontSize: 64,
    textAlign: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: "#E0E7FF",
    lineHeight: 22,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
    color: "#D1FAE5",
    fontStyle: "italic",
  },
  errorText: {
    color: "#FEE2E2",
    backgroundColor: "#991B1B",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    textAlign: "center",
  },
  dateSection: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  dateButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  datePicker: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    marginBottom: 16,
  },
  ageDisplay: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  ageLabel: {
    fontSize: 14,
    color: "#E0E7FF",
    marginBottom: 4,
  },
  ageValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  warningText: {
    color: "#FEE2E2",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600",
  },
  primaryButton: {
    height: 50,
    backgroundColor: "#10B981",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  privacyNote: {
    fontSize: 12,
    color: "#E0E7FF",
    textAlign: "center",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
