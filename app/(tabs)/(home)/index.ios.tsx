
import React, { useEffect, useState, useCallback } from "react";
import { Stack, useRouter, Redirect } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [dailyNumber, setDailyNumber] = useState<number | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ currentStreak: number; totalSubmissions: number; totalWins: number } | null>(null);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  console.log('HomeScreen: User authenticated:', !!user);

  const fetchDailyNumber = useCallback(async () => {
    // TODO: Backend Integration - GET /api/daily-number → { targetNumber, date, timeUntilReset }
    console.log('HomeScreen: Fetching daily number from API');
    setLoading(true);
    try {
      // Placeholder: Generate random number for now
      const randomNum = Math.floor(Math.random() * 1000000);
      setDailyNumber(randomNum);
      
      // Calculate time until midnight UTC
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCHours(24, 0, 0, 0);
      const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);
      setTimeUntilReset(secondsUntilMidnight);
    } catch (error) {
      console.error('HomeScreen: Error fetching daily number:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserStats = useCallback(async () => {
    // TODO: Backend Integration - GET /api/my-stats → { currentStreak, longestStreak, totalSubmissions, totalWins }
    console.log('HomeScreen: Fetching user stats from API');
    try {
      // Placeholder data
      setStats({
        currentStreak: 0,
        totalSubmissions: 0,
        totalWins: 0,
      });
      setHasSubmittedToday(false);
    } catch (error) {
      console.error('HomeScreen: Error fetching user stats:', error);
    }
  }, []);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('HomeScreen: Redirecting to auth screen');
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      console.log('HomeScreen: Fetching daily number and user stats');
      fetchDailyNumber();
      fetchUserStats();
    }
  }, [user, fetchDailyNumber, fetchUserStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timeUntilReset > 0) {
        setTimeUntilReset(prev => prev - 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeUntilReset]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secsStr = String(secs).padStart(2, '0');
    return `${hoursStr}:${minutesStr}:${secsStr}`;
  };

  const handleSnapPhoto = () => {
    console.log('HomeScreen: User tapped Snap a Number button');
    router.push('/camera');
  };

  const handleViewWinners = () => {
    console.log('HomeScreen: User tapped View Winners button');
    router.push('/winners');
  };

  const handleViewRules = () => {
    console.log('HomeScreen: User tapped View Rules button');
    router.push('/rules');
  };

  if (!authLoading && !user) {
    return <Redirect href="/auth" />;
  }

  if (authLoading || loading) {
    return (
      <>
        <Stack.Screen options={{ title: "NumSnap Daily", headerShown: false }} />
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  const timeDisplay = formatTime(timeUntilReset);
  const dailyNumberDisplay = dailyNumber !== null ? String(dailyNumber).padStart(6, '0') : '------';
  const streakDisplay = stats?.currentStreak || 0;
  const submissionsDisplay = stats?.totalSubmissions || 0;
  const winsDisplay = stats?.totalWins || 0;

  return (
    <>
      <Stack.Screen options={{ title: "NumSnap Daily", headerShown: false }} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>NumSnap</Text>
            <Text style={styles.appSubtitle}>Daily</Text>
          </View>

          {/* Today's Number Card */}
          <View style={styles.numberCard}>
            <Text style={styles.cardLabel}>Today's Number</Text>
            <View style={styles.numberContainer}>
              <Text style={styles.dailyNumber}>{dailyNumberDisplay}</Text>
            </View>
            <View style={styles.timerContainer}>
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="schedule" 
                size={20} 
                color={colors.textSecondary} 
              />
              <Text style={styles.timerText}>{timeDisplay}</Text>
            </View>
            <Text style={styles.timerLabel}>until next number</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="flame.fill" 
                android_material_icon_name="local-fire-department" 
                size={24} 
                color={colors.warning} 
              />
              <Text style={styles.statValue}>{streakDisplay}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="photo.fill" 
                android_material_icon_name="photo-camera" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.statValue}>{submissionsDisplay}</Text>
              <Text style={styles.statLabel}>Snaps</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="trophy.fill" 
                android_material_icon_name="emoji-events" 
                size={24} 
                color={colors.success} 
              />
              <Text style={styles.statValue}>{winsDisplay}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
          </View>

          {/* Main Action Button */}
          {!hasSubmittedToday ? (
            <TouchableOpacity 
              style={styles.snapButton} 
              onPress={handleSnapPhoto}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, '#FFA500']}
                style={styles.snapButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <IconSymbol 
                  ios_icon_name="camera.fill" 
                  android_material_icon_name="photo-camera" 
                  size={32} 
                  color="#FFFFFF" 
                />
                <Text style={styles.snapButtonText}>Snap a Number</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.submittedCard}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={48} 
                color={colors.success} 
              />
              <Text style={styles.submittedText}>Entry Submitted!</Text>
              <Text style={styles.submittedSubtext}>Check back tomorrow for results</Text>
            </View>
          )}

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleViewWinners}>
              <IconSymbol 
                ios_icon_name="star.fill" 
                android_material_icon_name="star" 
                size={20} 
                color={colors.primary} 
              />
              <Text style={styles.secondaryButtonText}>Recent Winners</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleViewRules}>
              <IconSymbol 
                ios_icon_name="info.circle.fill" 
                android_material_icon_name="info" 
                size={20} 
                color={colors.primary} 
              />
              <Text style={styles.secondaryButtonText}>Official Rules</Text>
            </TouchableOpacity>
          </View>

          {/* Prize Info */}
          <View style={styles.prizeCard}>
            <Text style={styles.prizeAmount}>$25</Text>
            <Text style={styles.prizeLabel}>Daily Prize</Text>
            <Text style={styles.prizeSubtext}>Match the number to win!</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: colors.neonGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  appSubtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: -5,
  },
  numberCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  numberContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginBottom: 15,
    shadowColor: colors.neonGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  dailyNumber: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
    fontFamily: 'Courier',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Courier',
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  snapButton: {
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  snapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  snapButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  submittedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  submittedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 15,
  },
  submittedSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  prizeCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  prizeAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  prizeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 5,
  },
  prizeSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
});
