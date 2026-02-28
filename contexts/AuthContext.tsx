
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { authClient, setBearerToken, clearAuthTokens, BEARER_TOKEN_KEY } from "@/lib/auth";
import { authenticatedGet, authenticatedPost, apiPost, apiGet, BACKEND_URL } from "@/utils/api";

// Direct API call for email/password auth (bypasses Better Auth client routing issues)
// The @specific-dev/framework uses Better Auth at /api/auth/sign-in/email and /api/auth/sign-up/email
async function directAuthPost<T = any>(endpoint: string, data: any): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  console.log("[DirectAuth] POST", url, JSON.stringify(data));
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const text = await response.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { error: text }; }
  console.log("[DirectAuth] Response", response.status, JSON.stringify(json));
  if (!response.ok) {
    const msg = json?.message || json?.error || `HTTP ${response.status}`;
    throw new Error(msg);
  }
  return json as T;
}

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  ageVerified?: boolean;
  verified?: boolean;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  ageVerified: boolean;
  emailVerified: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  verifyAge: (birthDateOrAge: Date | number) => Promise<void>;
  fetchUser: () => Promise<void>;
  refreshAgeStatus: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  handleDeepLinkVerification: (token: string) => Promise<{ success: boolean; message: string }>;
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
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    initializeAuth();

    const subscription = Linking.addEventListener("url", async (event) => {
      console.log("[AuthContext] Deep link received:", event.url);
      const url = Linking.parse(event.url);
      if (url.path === "verify" && url.queryParams?.token) {
        console.log("[AuthContext] Email verification deep link detected");
        await handleDeepLinkVerification(url.queryParams.token as string);
      } else {
        console.log("[AuthContext] Other deep link, refreshing user session");
        fetchUser();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      console.log("[AuthContext] Initializing auth state...");

      const persistedUser = await loadPersistedUserData();
      const persistedAgeVerified = await loadPersistedAgeVerified();

      if (persistedUser) {
        console.log("[AuthContext] Loaded persisted user:", persistedUser.email);
        setUser(persistedUser);
        setAgeVerified(persistedAgeVerified);
        setEmailVerified(persistedUser.verified ?? false);
      }

      await fetchUser();
    } catch (error) {
      console.error("[AuthContext] Failed to initialize auth:", error);
      setUser(null);
      setAgeVerified(false);
      setEmailVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      console.log("[AuthContext] Fetching user profile...");

      // First try to fetch /api/me directly with stored token
      // This works even if authClient.getSession() doesn't return a session
      try {
        console.log("[AuthContext] Fetching /api/me for full profile...");
        const profile = await authenticatedGet<{
          id: string;
          email: string;
          name: string;
          ageVerified: boolean;
          emailVerified?: boolean;
          verified?: boolean;
          isAdmin?: boolean;
        }>("/api/me");
        console.log("[AuthContext] /api/me response:", profile);

        const isEmailVerified = profile.emailVerified ?? profile.verified ?? false;

        const fullUser: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          ageVerified: profile.ageVerified,
          verified: isEmailVerified,
          isAdmin: profile.isAdmin ?? false,
        };

        const isAgeVerified = profile.ageVerified ?? false;
        setUser(fullUser);
        setAgeVerified(isAgeVerified);
        setEmailVerified(isEmailVerified);

        await persistUserData(fullUser);
        await persistAgeVerified(isAgeVerified);
        return;
      } catch (profileError: any) {
        console.warn("[AuthContext] /api/me failed:", profileError?.message);

        // If 401/403, token is invalid - clear everything
        if (
          profileError?.message?.includes("401") ||
          profileError?.message?.includes("403") ||
          profileError?.message?.includes("Authentication token not found")
        ) {
          console.log("[AuthContext] Token invalid or missing, trying authClient.getSession()...");
        } else {
          // Other error - don't clear auth state
          console.warn("[AuthContext] Non-auth error from /api/me, keeping existing state");
          return;
        }
      }

      // Fallback: try authClient.getSession()
      console.log("[AuthContext] Trying authClient.getSession() as fallback...");
      const session = await authClient.getSession();

      if (session?.data?.user) {
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }

        // Try /api/me again with the new token
        try {
          const profile = await authenticatedGet<{
            id: string;
            email: string;
            name: string;
            ageVerified: boolean;
            emailVerified?: boolean;
            verified?: boolean;
            isAdmin?: boolean;
          }>("/api/me");

          const isEmailVerified = profile.emailVerified ?? profile.verified ?? false;
          const fullUser: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            ageVerified: profile.ageVerified,
            verified: isEmailVerified,
            isAdmin: profile.isAdmin ?? false,
          };

          const isAgeVerified = profile.ageVerified ?? false;
          setUser(fullUser);
          setAgeVerified(isAgeVerified);
          setEmailVerified(isEmailVerified);
          await persistUserData(fullUser);
          await persistAgeVerified(isAgeVerified);
        } catch (e) {
          // Use session data as fallback
          const fallbackUser: User = {
            id: session.data.user.id,
            email: session.data.user.email,
            name: session.data.user.name,
            ageVerified: false,
            verified: false,
          };
          setUser(fallbackUser);
          setAgeVerified(false);
          setEmailVerified(false);
          await persistUserData(fallbackUser);
          await persistAgeVerified(false);
        }
      } else {
        console.log("[AuthContext] No active session found");
        setUser(null);
        setAgeVerified(false);
        setEmailVerified(false);
        await clearAuthTokens();
        await persistUserData(null);
        await persistAgeVerified(false);
      }
    } catch (error) {
      console.error("[AuthContext] Failed to fetch user:", error);
      setUser(null);
      setAgeVerified(false);
      setEmailVerified(false);
    }
  };

  const refreshAgeStatus = async () => {
    try {
      console.log("[AuthContext] Refreshing age status...");
      await fetchUser();
    } catch (error) {
      console.error("[AuthContext] Failed to refresh age status:", error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("[AuthContext] Signing in with email:", email);
      
      // Use authClient.signIn.email for Better Auth
      const result = await authClient.signIn.email({
        email,
        password,
      });

      console.log("[AuthContext] Sign in result:", result);

      if (result.data?.session?.token) {
        await setBearerToken(result.data.session.token);
      }

      await fetchUser();
    } catch (error: any) {
      console.error("[AuthContext] Email sign in failed:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("[AuthContext] Signing up with email:", email);
      
      // Use authClient.signUp.email for Better Auth
      const result = await authClient.signUp.email({
        email,
        password,
        name: name || email.split('@')[0],
      });

      console.log("[AuthContext] Sign up result:", result);

      if (result.data?.session?.token) {
        await setBearerToken(result.data.session.token);
      }

      await fetchUser();

      return {
        success: true,
        message: "Account created successfully! Please check your email to verify your account.",
      };
    } catch (error: any) {
      console.error("[AuthContext] Email sign up failed:", error);
      const errorMessage = error?.message || "Sign up failed";
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const verifyAge = async (birthDateOrAge: Date | number) => {
    try {
      console.log("[AuthContext] Verifying age...");
      
      let age: number;
      if (birthDateOrAge instanceof Date) {
        const today = new Date();
        age = today.getFullYear() - birthDateOrAge.getFullYear();
        const monthDiff = today.getMonth() - birthDateOrAge.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateOrAge.getDate())) {
          age--;
        }
      } else {
        age = birthDateOrAge;
      }

      console.log("[AuthContext] Calculated age:", age);

      const response = await authenticatedPost<{ success: boolean; ageVerified: boolean }>("/api/verify-age", { age });

      if (response.success && response.ageVerified) {
        setAgeVerified(true);
        await persistAgeVerified(true);
        
        // Update user object
        if (user) {
          const updatedUser = { ...user, ageVerified: true };
          setUser(updatedUser);
          await persistUserData(updatedUser);
        }
      }
    } catch (error: any) {
      console.error("[AuthContext] Age verification failed:", error);
      throw error;
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("[AuthContext] Resending verification email to:", email);
      
      const response = await apiPost<{ success: boolean; message: string }>("/api/resend-verification", { email });
      
      return response;
    } catch (error: any) {
      console.error("[AuthContext] Resend verification failed:", error);
      return {
        success: false,
        message: error?.message || "Failed to resend verification email",
      };
    }
  };

  const handleDeepLinkVerification = async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("[AuthContext] Verifying email with token...");
      
      const response = await apiGet<{ success: boolean; message: string }>(`/api/verify?token=${token}`);
      
      if (response.success) {
        await fetchUser();
      }
      
      return response;
    } catch (error: any) {
      console.error("[AuthContext] Email verification failed:", error);
      return {
        success: false,
        message: error?.message || "Email verification failed",
      };
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      console.log("[AuthContext] Signing in with", provider);
      
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        // Native: Use expo-linking to generate a proper deep link
        const callbackURL = Linking.createURL("/");
        await authClient.signIn.social({
          provider,
          callbackURL,
        });
        
        // The redirect will reload the app or be handled by deep linking
        await fetchUser();
      }
    } catch (error: any) {
      console.error(`[AuthContext] ${provider} sign in failed:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      console.log("[AuthContext] Signing out...");
      await authClient.signOut();
    } catch (error) {
      console.error("[AuthContext] Sign out failed (API):", error);
    } finally {
      // Always clear local state
      setUser(null);
      setAgeVerified(false);
      setEmailVerified(false);
      await clearAuthTokens();
      await persistUserData(null);
      await persistAgeVerified(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        ageVerified,
        emailVerified,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        verifyAge,
        fetchUser,
        refreshAgeStatus,
        resendVerificationEmail,
        handleDeepLinkVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
