
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();

    // Listen for deep links (e.g. from social auth redirects)
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("Deep link received, refreshing user session");
      fetchUser();
    });

    // POLLING: Refresh session every 5 minutes to keep SecureStore token in sync
    // This prevents 401 errors when the session token rotates
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing user session to sync token...");
      fetchUser();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log("[Auth] Fetching user session...");
      const session = await authClient.getSession();
      console.log("[Auth] Session response:", JSON.stringify(session));

      if (session?.error) {
        console.warn("[Auth] Session fetch returned error:", session.error.message || session.error.statusText);
        setUser(null);
        await clearAuthTokens();
        return;
      }
      
      if (session?.data?.user) {
        console.log("[Auth] User authenticated:", session.data.user.email);
        setUser(session.data.user as User);
        // Sync token to SecureStore/localStorage for utils/api.ts authenticated calls
        if (session.data.session?.token) {
          console.log("[Auth] Syncing bearer token to storage");
          await setBearerToken(session.data.session.token);
        } else {
          console.warn("[Auth] Session found but no token in session data - API calls may fail");
        }
      } else {
        console.log("[Auth] No active session found");
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("[Auth] Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("[Auth] Calling authClient.signIn.email with:", { email });
      const result = await authClient.signIn.email({ email, password });
      console.log("[Auth] Sign in raw result:", JSON.stringify(result));

      // Better Auth returns { data, error } - it does NOT throw on auth failures
      if (result?.error) {
        const errMsg = result.error.message || result.error.statusText || "Sign in failed";
        const errStatus = result.error.status;
        console.error("[Auth] Sign in error from server:", errStatus, errMsg);

        // Map server error messages to user-friendly text
        let friendlyMessage = errMsg;
        const lower = errMsg.toLowerCase();
        if (errStatus === 401 || lower.includes("invalid") || lower.includes("credentials") || lower.includes("password")) {
          friendlyMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (lower.includes("no account") || lower.includes("user not found") || lower.includes("not found")) {
          friendlyMessage = "No account found with this email. Please sign up first.";
        } else if (lower.includes("verify") || lower.includes("verification") || lower.includes("verified")) {
          friendlyMessage = "Please verify your email address before signing in.";
        } else if (lower.includes("network") || lower.includes("fetch") || lower.includes("connection")) {
          friendlyMessage = "Network error. Please check your internet connection and try again.";
        }

        throw new Error(friendlyMessage);
      }

      // Sync bearer token if returned directly in sign-in response
      if (result?.data?.token) {
        console.log("[Auth] Syncing bearer token from sign-in response");
        await setBearerToken(result.data.token);
      } else if (result?.data?.session?.token) {
        console.log("[Auth] Syncing bearer token from session in sign-in response");
        await setBearerToken(result.data.session.token);
      }

      await fetchUser();
      console.log("[Auth] User fetched after sign in");
    } catch (error: any) {
      console.error("[Auth] Email sign in failed:", error);
      console.error("[Auth] Error details:", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        response: error.response,
      });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log("[Auth] Calling authClient.signUp.email with:", { email, name });
      const result = await authClient.signUp.email({
        email,
        password,
        name: name || email.split("@")[0],
      });
      console.log("[Auth] Sign up raw result:", JSON.stringify(result));

      // Better Auth returns { data, error } - it does NOT throw on auth failures
      if (result?.error) {
        const errMsg = result.error.message || result.error.statusText || "Sign up failed";
        const errStatus = result.error.status;
        console.error("[Auth] Sign up error from server:", errStatus, errMsg);

        let friendlyMessage = errMsg;
        const lower = errMsg.toLowerCase();
        if (lower.includes("exists") || lower.includes("already") || lower.includes("duplicate")) {
          friendlyMessage = "An account with this email already exists. Please sign in instead.";
        } else if (lower.includes("password") && (lower.includes("weak") || lower.includes("short") || lower.includes("length"))) {
          friendlyMessage = "Password is too weak. Please use a stronger password (at least 8 characters).";
        } else if (lower.includes("email") && lower.includes("invalid")) {
          friendlyMessage = "Please enter a valid email address.";
        } else if (lower.includes("network") || lower.includes("fetch") || lower.includes("connection")) {
          friendlyMessage = "Network error. Please check your internet connection and try again.";
        }

        throw new Error(friendlyMessage);
      }

      // Sync bearer token if returned directly in sign-up response
      if (result?.data?.token) {
        console.log("[Auth] Syncing bearer token from sign-up response");
        await setBearerToken(result.data.token);
      } else if (result?.data?.session?.token) {
        console.log("[Auth] Syncing bearer token from session in sign-up response");
        await setBearerToken(result.data.session.token);
      }

      await fetchUser();
      console.log("[Auth] User fetched after sign up");
    } catch (error: any) {
      console.error("[Auth] Email sign up failed:", error);
      console.error("[Auth] Error details:", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        response: error.response,
      });
      throw error;
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      console.log(`Starting ${provider} sign in...`);
      
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        // Native: Use expo-linking to generate a proper deep link
        const callbackURL = Linking.createURL("/");
        console.log("OAuth callback URL:", callbackURL);
        
        await authClient.signIn.social({
          provider,
          callbackURL,
        });
        
        // The redirect will reload the app or be handled by deep linking
        await fetchUser();
      }
      
      console.log(`${provider} sign in completed`);
    } catch (error) {
      console.error(`${provider} sign in failed:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      console.log("Signing out user...");
      await authClient.signOut();
      console.log("Sign out API call successful");
    } catch (error) {
      console.error("Sign out failed (API):", error);
    } finally {
       // Always clear local state
       console.log("Clearing local auth state");
       setUser(null);
       await clearAuthTokens();
       console.log("User signed out locally");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
