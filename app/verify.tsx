
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

export default function VerifyScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { handleDeepLinkVerification } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        console.log("[Verify] No token provided");
        setStatus("error");
        setMessage("Invalid verification link");
        setTimeout(() => router.replace("/(auth)/login"), 3000);
        return;
      }

      try {
        console.log("[Verify] Verifying email with token:", token);
        const result = await handleDeepLinkVerification(token);
        console.log("[Verify] Verification successful:", result);
        setStatus("success");
        setMessage(result.message || "Email verified successfully! Please log in.");
        setTimeout(() => {
          console.log("[Verify] Redirecting to login screen");
          router.replace("/(auth)/login");
        }, 2000);
      } catch (error: any) {
        console.error("[Verify] Verification failed:", error);
        setStatus("error");
        setMessage(error.message || "Verification failed. Please try again.");
        setTimeout(() => router.replace("/(auth)/login"), 3000);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <LinearGradient
      colors={["#1E3A8A", "#3B82F6", "#60A5FA"]}
      style={styles.container}
    >
      <View style={styles.content}>
        {status === "loading" && (
          <>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.title}>Verifying your email...</Text>
          </>
        )}
        
        {status === "success" && (
          <>
            <Text style={styles.icon}>✅</Text>
            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.subtitle}>Redirecting to login...</Text>
          </>
        )}
        
        {status === "error" && (
          <>
            <Text style={styles.icon}>❌</Text>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.subtitle}>Redirecting to login...</Text>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#E0E7FF",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    color: "#D1FAE5",
    textAlign: "center",
    fontStyle: "italic",
  },
});
