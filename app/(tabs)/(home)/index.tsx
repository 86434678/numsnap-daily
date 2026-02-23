
import React, { useEffect, useState, useCallback } from "react";
import { Stack, useRouter, Redirect } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Modal } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, authenticatedGet } from "@/utils/api";
import { useFocusEffect } from "@react-navigation/native";

// Ad integration toggle (set to true when ads are integrated)
const AD_INTEGRATION_ENABLED = false;
const MAX_HINTS_PER_DAY = 2;

export default function HomeScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ currentStreak: number; totalSubmissions: number; totalWins: number } | null>(null);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [hintText, setHintText] = useState<string>('');
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [showHintModal, setShowHintModal] = useState(false);
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);
  const [checkingAge, setCheckingAge] = useState(true);

  console.log('HomeScreen: User authenticated:', !!user);

  const fetchDailyNumber = useCallback(async () => {
    console.log('[API] Requesting /api/daily-number...');
    setLoading(true);
    try {
      const data = await authenticatedGet<{ 
        hasSubmitted: boolean; 
        date: string; 
        timeUntilReset: number;
        revealTimePST?: string;
        currentTimePST?: string;
      }>('/api/daily-number');
      console.log('[API] /api/daily-number response:', data);
      // Cap at 86400 seconds (24 hours max) as a safety measure
      setTimeUntilReset(Math.min(86400, Math.max(0, data.timeUntilReset)));
      setHasSubmittedToday(data.hasSubmitted);
    } catch (error) {
      console.error('HomeScreen: Error fetching daily number:', error);
      // Fallback: calculate seconds until 11:59:59 PM PST (UTC-8)
      const now = new Date();
      const PST_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC-8
      const nowPST = new Date(now.getTime() - PST_OFFSET_MS);
      // Target: 23:59:59 PST today
      const resetPST = new Date(nowPST);
      resetPST.setUTCHours(23, 59, 59, 0);
      let secondsUntilReset = Math.floor((resetPST.getTime() - nowPST.getTime()) / 1000);
      // If already past 11:59:59 PM PST today, target tomorrow's 11:59:59 PM PST
      if (secondsUntilReset <= 0) {
        resetPST.setUTCDate(resetPST.getUTCDate() + 1);
        secondsUntilReset = Math.floor((resetPST.getTime() - nowPST.getTime()) / 1000);
      }
      // Cap at 86400 seconds (24 hours max)
      setTimeUntilReset(Math.min(86400, Math.max(0, secondsUntilReset)));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserStats = useCallback(async () => {
    console.log('[API] Requesting /api/my-stats...');
    try {
      const data = await authenticatedGet<{
        currentStreak: number;
        longestStreak: number;
        totalSubmissions: number;
        totalWins: number;
        recentSubmissions: { date: string; photoUrl: string; confirmedNumber: number; isWinner: boolean }[];
      }>('/api/my-stats');
      console.log('[API] /api/my-stats response:', data);
      setStats({
        currentStreak: data.currentStreak,
        totalSubmissions: data.totalSubmissions,
        totalWins: data.totalWins,
      });

      const today = new Date().toISOString().split('T')[0];
      const submittedToday = data.recentSubmissions?.some(
        (s) => s.date && s.date.startsWith(today)
      ) ?? false;
      setHasSubmittedToday(submittedToday);
    } catch (error) {
      console.error('HomeScreen: Error fetching user stats:', error);
      setStats({ currentStreak: 0, totalSubmissions: 0, totalWins: 0 });
      setHasSubmittedToday(false);
    }
  }, []);

  const checkAgeVerification = useCallback(async () => {
    console.log('[API] Checking age verification status...');
    setCheckingAge(true);
    try {
      const data = await authenticatedGet<{ ageVerified: boolean }>('/api/user/age-status');
      console.log('[API] Age verification status:', data);
      setAgeVerified(data.ageVerified);
      
      if (!data.ageVerified) {
        console.log('HomeScreen: User not age verified - redirecting to age verification');
        router.push('/age-verification');
      }
    } catch (error) {
      console.error('HomeScreen: Error checking age verification:', error);
      setAgeVerified(false);
    } finally {
      setCheckingAge(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('HomeScreen: Redirecting to auth screen');
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      console.log('HomeScreen: Checking age verification and fetching data');
      checkAgeVerification();
      fetchDailyNumber();
      fetchUserStats();
    }
  }, [user, checkAgeVerification, fetchDailyNumber, fetchUserStats]);

  // Re-check age verification when screen comes back into focus (e.g. after age-verification screen)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('HomeScreen: Screen focused - re-checking age verification');
        checkAgeVerification();
      }
    }, [user, checkAgeVerification])
  );

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

  const generateHint = () => {
    const hints = [
      'The target is between 1 and 500000',
      'The target is between 100000 and 999999',
      'The target is a 6-digit number',
      'The target is between 50000 and 750000',
      'The target is between 200000 and 800000',
    ];
    const randomIndex = Math.floor(Math.random() * hints.length);
    return hints[randomIndex];
  };

  const handleWatchAdForHint = () => {
    console.log('HomeScreen: User tapped Watch Ad for Hint button');
    
    // Check if hints limit reached
    if (hintsUsed >= MAX_HINTS_PER_DAY) {
      setShowHintModal(true);
      setHintText(`You've used all ${MAX_HINTS_PER_DAY} hints for today. Try again tomorrow!`);
      return;
    }

    // Check if challenge is active
    if (timeUntilReset <= 0) {
      setShowHintModal(true);
      setHintText('Hints are only available during the active daily challenge.');
      return;
    }

    if (!AD_INTEGRATION_ENABLED) {
      // Pre-launch: Show free hint
      console.log('HomeScreen: Showing free hint (ads not integrated yet)');
      const hint = generateHint();
      setHintText(`Ads coming soon! Here's a free hint: ${hint}`);
      setHintsUsed(prev => prev + 1);
      setShowHintModal(true);
    } else {
      // TODO: Backend Integration - Trigger rewarded ad and get hint
      // When ads are integrated:
      // 1. Load and show rewarded ad
      // 2. On ad completion, call backend to get hint
      // 3. Update hintsUsed and display hint
      console.log('HomeScreen: Would trigger rewarded ad here');
    }
  };

  const closeHintModal = () => {
    setShowHintModal(false);
  };

  const handleSnapPhoto = () => {
    console.log('HomeScreen: User tapped Snap a Number button');
    
    // Check age verification before allowing snap
    if (ageVerified === false) {
      console.log('HomeScreen: User not age verified - redirecting to age verification');
      router.push('/age-verification');
      return;
    }
    
    router.push('/camera');
  };

  const handleViewResults = () => {
    console.log('HomeScreen: User tapped View Results button');
    router.push('/reveal-result');
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
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  const timeDisplay = formatTime(timeUntilReset);
  const streakDisplay = stats?.currentStreak || 0;
  const submissionsDisplay = stats?.totalSubmissions || 0;
  const winsDisplay = stats?.totalWins || 0;
  const hintsRemainingText = `${hintsUsed}/${MAX_HINTS_PER_DAY} hints used`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]}
        >
          <View style={styles.header}>
            <Text style={styles.appTitle}>NumSnap</Text>
            <Text style={styles.appSubtitle}>Daily</Text>
          </View>

          <View style={styles.numberCard}>
            <Text style={styles.cardLabel}>Today&apos;s Challenge</Text>
            <View style={styles.hiddenNumberContainer}>
              <IconSymbol 
                ios_icon_name="eye.slash.fill" 
                android_material_icon_name="visibility-off" 
                size={40} 
                color="rgba(255, 255, 255, 0.6)" 
              />
              <Text style={styles.hiddenText}>Number Hidden</Text>
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
            <Text style={styles.timezoneNote}>All times in PST</Text>

            {!hasSubmittedToday && (
              <>
                <TouchableOpacity 
                  style={styles.hintButton}
                  onPress={handleWatchAdForHint}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.secondary, '#9B59B6']}
                    style={styles.hintButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <IconSymbol 
                      ios_icon_name="play.circle.fill" 
                      android_material_icon_name="play-circle-filled" 
                      size={24} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.hintButtonText}>Get a Hint (Watch Short Ad)</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.hintsRemaining}>{hintsRemainingText}</Text>

                <Text style={styles.legalNote}>
                  Watching ads is optional and does not increase your chances of winning beyond free methods.
                </Text>

                {hintText && !showHintModal ? (
                  <View style={styles.hintDisplay}>
                    <IconSymbol 
                      ios_icon_name="lightbulb.fill" 
                      android_material_icon_name="lightbulb" 
                      size={20} 
                      color={colors.warning} 
                    />
                    <Text style={styles.hintDisplayText}>{hintText}</Text>
                  </View>
                ) : null}
              </>
            )}

            {hasSubmittedToday && (
              <Text style={styles.hintText}>Submit your snap to reveal!</Text>
            )}
          </View>

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
            <View style={styles.submittedContainer}>
              <View style={styles.submittedCard}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle" 
                  size={48} 
                  color={colors.success} 
                />
                <Text style={styles.submittedText}>Entry Submitted!</Text>
                <Text style={styles.submittedSubtext}>Tap below to see your result</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewResultsButton} 
                onPress={handleViewResults}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.secondary, '#9B59B6']}
                  style={styles.viewResultsGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <IconSymbol 
                    ios_icon_name="eye.fill" 
                    android_material_icon_name="visibility" 
                    size={24} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.viewResultsText}>View Your Result</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

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

          <View style={styles.prizeCard}>
            <Text style={styles.prizeAmount}>$25</Text>
            <Text style={styles.prizeLabel}>Daily Prize</Text>
            <Text style={styles.prizeSubtext}>Match the number to win!</Text>
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showHintModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeHintModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <IconSymbol 
              ios_icon_name="lightbulb.fill" 
              android_material_icon_name="lightbulb" 
              size={48} 
              color={colors.warning} 
            />
            <Text style={styles.modalTitle}>Hint</Text>
            <Text style={styles.modalText}>{hintText}</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={closeHintModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    elevation: 8,
  },
  cardLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  hiddenNumberContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 15,
    paddingHorizontal: 40,
    paddingVertical: 25,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
  },
  hiddenText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
    letterSpacing: 2,
  },
  hintText: {
    fontSize: 13,
    color: colors.secondary,
    marginTop: 10,
    fontWeight: '600',
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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
  },
  timezoneNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    fontStyle: 'italic',
    marginBottom: 15,
  },
  hintButton: {
    marginTop: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    width: '100%',
  },
  hintButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  hintButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hintsRemaining: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  legalNote: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
  hintDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  hintDisplayText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
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
    elevation: 3,
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
    elevation: 8,
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
  submittedContainer: {
    marginBottom: 20,
  },
  submittedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 15,
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
  viewResultsButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  viewResultsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  viewResultsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
