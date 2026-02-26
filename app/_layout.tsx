import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
// Note: Error logging is auto-initialized via index.ts import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

/**
 * Auth Bootstrap Guard — implements the "Auth Bootstrap" rule.
 * Shows a loading splash while checking session, then redirects appropriately.
 * This prevents redirect loops on app reload.
 */
function AuthBootstrapGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return; // Still checking session — wait

    const inAuthGroup = segments[0] === "auth" || segments[0] === "auth-popup" || segments[0] === "auth-callback";

    if (!user && !inAuthGroup) {
      // Not authenticated and not on auth screen — redirect to auth
      console.log("[AuthBootstrap] No user session, redirecting to /auth");
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      // Authenticated but on auth screen — redirect to home
      console.log("[AuthBootstrap] User authenticated, redirecting to home");
      router.replace("/(tabs)/(home)/");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={bootstrapStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={bootstrapStyles.loadingText}>Loading NumSnap Daily...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const bootstrapStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      setShowOfflineModal(true);
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)", // System Blue
      background: "rgb(242, 242, 247)", // Light mode background
      card: "rgb(255, 255, 255)", // White cards/surfaces
      text: "rgb(0, 0, 0)", // Black text for light mode
      border: "rgb(216, 216, 220)", // Light gray for separators/borders
      notification: "rgb(255, 59, 48)", // System Red
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)", // System Blue (Dark Mode)
      background: "rgb(1, 1, 1)", // True black background for OLED displays
      card: "rgb(28, 28, 30)", // Dark card/surface color
      text: "rgb(255, 255, 255)", // White text for dark mode
      border: "rgb(44, 44, 46)", // Dark gray for separators/borders
      notification: "rgb(255, 69, 58)", // System Red (Dark Mode)
    },
  };
  return (
    <>
      <StatusBar style="auto" animated />
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <AuthProvider>
            <WidgetProvider>
              <GestureHandlerRootView>
              {/* Offline notification modal */}
              <Modal
                visible={showOfflineModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOfflineModal(false)}
              >
                <View style={offlineStyles.overlay}>
                  <View style={offlineStyles.modal}>
                    <Text style={offlineStyles.title}>🔌 You are offline</Text>
                    <Text style={offlineStyles.message}>
                      You can keep using the app! Your changes will be saved locally and synced when you are back online.
                    </Text>
                    <TouchableOpacity
                      style={offlineStyles.button}
                      onPress={() => setShowOfflineModal(false)}
                    >
                      <Text style={offlineStyles.buttonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              <AuthBootstrapGuard>
                <Stack>
                  {/* Auth screens */}
                  <Stack.Screen name="auth" options={{ headerShown: false }} />
                  <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
                  <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
                  
                  {/* Main app with tabs */}
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  
                  {/* Camera screen (no tabs - would block controls) */}
                  <Stack.Screen name="camera" options={{ headerShown: true, title: "Snap a Number", presentation: "modal" }} />
                  
                  {/* Confirmation screen */}
                  <Stack.Screen name="confirm-submission" options={{ headerShown: true, title: "Confirm Entry", presentation: "modal" }} />
                  
                  {/* Winners screen */}
                  <Stack.Screen name="winners" options={{ headerShown: true, title: "Recent Winners" }} />
                  
                  {/* Rules screen */}
                  <Stack.Screen name="rules" options={{ headerShown: true, title: "Official Rules" }} />
                  
                  {/* Reveal result screen */}
                  <Stack.Screen name="reveal-result" options={{ headerShown: false, presentation: "modal" }} />
                  
                  {/* Age verification screen */}
                  <Stack.Screen name="age-verification" options={{ headerShown: false, presentation: "modal" }} />
                  
                  {/* Prize claim screen */}
                  <Stack.Screen name="claim-prize" options={{ headerShown: true, title: "Claim Your Prize", presentation: "modal" }} />
                  
                  {/* 404 */}
                  <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
                </Stack>
              </AuthBootstrapGuard>
              <SystemBars style={"auto"} />
              </GestureHandlerRootView>
            </WidgetProvider>
          </AuthProvider>
        </ThemeProvider>
    </>
  );
}

const offlineStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
