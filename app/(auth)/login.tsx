
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.9,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  socialButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    color: "#fff",
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.8,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  linkText: {
    color: "#fff",
    fontSize: 14,
  },
  link: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#ff6b6b",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    textAlign: "center",
  },
  forgotPasswordButton: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: "#fff",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const { signInWithEmail, signInWithGoogle, signInWithApple, resendVerificationEmail } = useAuth();
  const router = useRouter();

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const handleResendVerification = async () => {
    if (!email) {
      showAlert("Email Required", "Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const result = await resendVerificationEmail(email);
      if (result.success) {
        showAlert("Success", result.message);
      } else {
        showAlert("Error", result.message);
      }
    } catch (error: any) {
      showAlert("Error", error?.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("[LoginScreen] Attempting login for:", email);
      
      await signInWithEmail(email, password);
      
      console.log("[LoginScreen] Login successful, navigating to home");
      router.replace("/(tabs)/(home)/");
    } catch (error: any) {
      console.error("[LoginScreen] Login error:", error);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (error?.message) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("401")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (msg.includes("not found") || msg.includes("404")) {
          errorMessage = "Account not found. Please sign up first.";
        } else if (msg.includes("verify") || msg.includes("verification")) {
          errorMessage = "Please verify your email before logging in.";
          showAlert(
            "Email Verification Required",
            "Please check your email (including spam/junk folder) for the verification link. Click below to resend."
          );
          return;
        } else if (msg.includes("network") || msg.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "apple") => {
    try {
      setLoading(true);
      setError("");
      
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
      
      router.replace("/(tabs)/(home)/");
    } catch (error: any) {
      console.error(`[LoginScreen] ${provider} auth error:`, error);
      setError(error?.message || `${provider} sign in failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    showAlert(
      "Password Reset",
      "Password reset functionality will be available soon. Please contact support if you need assistance."
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={["#6A1B9A", "#8E24AA", "#AB47BC"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue your NumSnap journey</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialAuth("google")}
            disabled={loading}
          >
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth("apple")}
              disabled={loading}
            >
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")} disabled={loading}>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{alertTitle}</Text>
            <Text style={styles.modalMessage}>{alertMessage}</Text>
            {alertTitle === "Email Verification Required" ? (
              <>
                <TouchableOpacity style={[styles.modalButton, { marginBottom: 12 }]} onPress={handleResendVerification}>
                  <Text style={styles.modalButtonText}>Resend Verification Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#999" }]} onPress={hideAlert}>
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.modalButton} onPress={hideAlert}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
