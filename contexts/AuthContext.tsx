
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { authClient, setBearerToken, clearAuthTokens, BEARER_TOKEN_KEY } from "@/lib/auth";
import { authenticatedGet, authenticatedPost } from "@/utils/api";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  ageVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  ageVerified: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  verifyAge: (age: number) => Promise<void>;
  fetchUser: () => Promise<void>;
  refreshAgeStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_DATA_KEY = "numsnap_user_data";
const AGE_VERIFIED_KEY = "numsnap_age_verified";

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

// Helper to persist user data to SecureStore
async function persistUserData(user: User | null) {
  try {
    if (Platform.OS === "web") {
      if (user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_DATA_KEY);
      }
    } else {
      if (user) {
        await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
      } else {
        await SecureStore.deleteItemAsync(USER_DATA_KEY);
      }
    }
  } catch (error) {
    console.error("[AuthContext] Failed to persist user data:", error);
  }
}

// Helper to persist age verified status
async function persistAgeVerified(verified: boolean) {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(AGE_VERIFIED_KEY, verified ? "true" : "false");
    } else {
      await SecureStore.setItemAsync(AGE_VERIFIED_KEY, verified ? "true" : "false");
    }
  } catch (error) {
    console.error("[AuthContext] Failed to persist age verified:", error);
  }
}

// Helper to load persisted user data
async function loadPersistedUserData(): Promise<User | null> {
  try {
    let userData: string | null = null;
    if (Platform.OS === "web") {
      userData = localStorage.getItem(USER_DATA_KEY);
    } else {
      userData = await SecureStore.getItemAsync(USER_DATA_KEY);
    }
    
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.error("[AuthContext] Failed to load persisted user data:", error);
  }
  return null;
}

// Helper to load persisted age verified status
async function loadPersistedAgeVerified(): Promise<boolean> {
  try {
    let ageVerified: string | null = null;
    if (Platform.OS === "web") {
      ageVerified = localStorage.getItem(AGE_VERIFIED_KEY);
    } else {
      ageVerified = await SecureStore.getItemAsync(AGE_VERIFIED_KEY);
    }
    
    return ageVerified === "true";
  } catch (error) {
    console.error("[AuthContext] Failed to load persisted age verified:", error);
  }
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();

    // Listen for deep links (e.g. from social auth redirects)
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("[AuthContext] Deep link received, refreshing user session");
      fetchUser();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      console.log("[AuthContext] Initializing auth state...");
      
      // First, load persisted data for immediate UI update
      const persistedUser = await loadPersistedUserData();
      const persistedAgeVerified = await loadPersistedAgeVerified();
      
      if (persistedUser) {
        console.log("[AuthContext] Loaded persisted user:", persistedUser.email);
        setUser(persistedUser);
        setAgeVerified(persistedAgeVerified);
      }
      
      // Then verify with backend
      await fetchUser();
    } catch (error) {
      console.error("[AuthContext] Failed to initialize auth:", error);
      setUser(null);
      setAgeVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      console.log("[AuthContext] Fetching session...");
      const session = await authClient.getSession();
      
      if (session?.data?.user) {
        // Sync token to SecureStore for utils/api.ts
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }

        // Fetch full user profile from /api/me to get ageVerified status
        try {
          console.log("[AuthContext] Fetching /api/me for full profile...");
          const profile = await authenticatedGet<{ id: string; email: string; name: string; ageVerified: boolean }>("/api/me");
          console.log("[AuthContext] /api/me response:", profile);
          
          const fullUser: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            ageVerified: profile.ageVerified,
          };
          
          setUser(fullUser);
          setAgeVerified(profile.ageVerified ?? false);
          
          // Persist to storage
          await persistUserData(fullUser);
          await persistAgeVerified(profile.ageVerified ?? false);
        } catch (profileError: any) {
          console.warn("[AuthContext] Could not fetch /api/me:", profileError);
          
          // If token is invalid (401/403), clear everything
          if (profileError?.message?.includes("401") || profileError?.message?.includes("403")) {
            console.log("[AuthContext] Token invalid, clearing auth state");
            setUser(null);
            setAgeVerified(false);
            await clearAuthTokens();
            await persistUserData(null);
            await persistAgeVerified(false);
          } else {
            // Use session user as fallback
            const fallbackUser: User = {
              id: session.data.user.id,
              email: session.data.user.email,
              name: session.data.user.name,
              ageVerified: false,
            };
            setUser(fallbackUser);
            setAgeVerified(false);
            await persistUserData(fallbackUser);
            await persistAgeVerified(false);
          }
        }
      } else {
        console.log("[AuthContext] No active session found");
        setUser(null);
        setAgeVerified(false);
        await clearAuthTokens();
        await persistUserData(null);
        await persistAgeVerified(false);
      }
    } catch (error) {
      console.error("[AuthContext] Failed to fetch user:", error);
      setUser(null);
      setAgeVerified(false);
    }
  };

  const refreshAgeStatus = async () => {
    try {
      console.log("[AuthContext] Refreshing age verification status from /api/user/age-status...");
      const data = await authenticatedGet<{ ageVerified: boolean }>("/api/user/age-status");
      console.log("[AuthContext] Age status:", data);
      
      setAgeVerified(data.ageVerified ?? false);
      await persistAgeVerified(data.ageVerified ?? false);
      
      if (user) {
        const updatedUser = { ...user, ageVerified: data.ageVerified };
        setUser(updatedUser);
        await persistUserData(updatedUser);
      }
    } catch (error) {
      console.error("[AuthContext] Failed to refresh age status:", error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("[AuthContext] Signing in with email...");
      const result = await authClient.signIn.email({ email, password });
      if (result?.error) {
        throw new Error(result.error.message || "Sign in failed");
      }
      await fetchUser();
    } catch (error) {
      console.error("[AuthContext] Email sign in failed:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("[AuthContext] Signing up with email (no auto-login)...");
      // Use Better Auth signup - does NOT auto-login per spec
      const result = await authClient.signUp.email({
        email,
        password,
        name: name || email.split("@")[0],
      });
      if (result?.error) {
        throw new Error(result.error.message || "Sign up failed");
      }
      // Do NOT call fetchUser - user must verify email first
      console.log("[AuthContext] Sign up successful, awaiting email verification");
      return {
        success: true,
        message: "Account created. Please check your email to verify.",
      };
    } catch (error) {
      console.error("[AuthContext] Email sign up failed:", error);
      throw error;
    }
  };

  const verifyAge = async (age: number) => {
    try {
      console.log("[AuthContext] Verifying age:", age);
      const result = await authenticatedPost<{ success: boolean; ageVerified: boolean }>("/api/verify-age", { age });
      console.log("[AuthContext] Age verification result:", result);
      
      if (result.success && result.ageVerified) {
        setAgeVerified(true);
        await persistAgeVerified(true);
        
        if (user) {
          const updatedUser = { ...user, ageVerified: true };
          setUser(updatedUser);
          await persistUserData(updatedUser);
        }
      } else {
        throw new Error("Age verification failed");
      }
    } catch (error) {
      console.error("[AuthContext] Age verification failed:", error);
      throw error;
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        const callbackURL = Linking.createURL("/");
        await authClient.signIn.social({
          provider,
          callbackURL,
        });
        await fetchUser();
      }
    } catch (error) {
      console.error(`[AuthContext] ${provider} sign in failed:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      // Clear local state immediately (don't wait for server)
      setUser(null);
      setAgeVerified(false);
      await clearAuthTokens();
      await persistUserData(null);
      await persistAgeVerified(false);
      
      // Try to sign out from server
      await authClient.signOut();
      console.log("[AuthContext] Signed out successfully");
    } catch (error) {
      console.error("[AuthContext] Sign out API call failed (local state already cleared):", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        ageVerified,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        verifyAge,
        fetchUser,
        refreshAgeStatus,
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
