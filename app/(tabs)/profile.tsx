
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";
import { useRouter } from "expo-router";
import { authenticatedGet } from "@/utils/api";

interface Submission {
  id: string;
  date: string;
  photoUrl: string;
  confirmedNumber: number;
  targetNumber: number;
  isWinner: boolean;
  revealTimePST?: string;
}

interface EligiblePrize {
  submissionId: string;
  winningNumber: number;
  date: string;
  prizeAmount: number;
  canClaim: boolean;
  claimDeadline: string;
}

interface PrizeClaim {
  claimId: string;
  submissionId: string;
  winningNumber: number;
  date: string;
  paymentMethod: string;
  paymentInfo: string;
  claimStatus: string;
  claimedAt: string;
  expiresAt: string;
  processedAt: string | null;
}

export default function ProfileScreen() {
  const { colors: themeColors } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<{
    currentStreak: number;
    longestStreak: number;
    totalSubmissions: number;
    totalWins: number;
  } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentTimePST, setCurrentTimePST] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [eligiblePrizes, setEligiblePrizes] = useState<EligiblePrize[]>([]);
  const [prizeClaims, setPrizeClaims] = useState<PrizeClaim[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(false);

  console.log('ProfileScreen: User:', user?.email);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchPrizeData();
    }
  }, [user]);

  // Refresh prize data when screen comes back into focus (e.g. after claiming a prize)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('ProfileScreen: Screen focused - refreshing prize data');
        fetchPrizeData();
      }
    }, [user])
  );

  // Tick currentTimePST every 10 seconds so reveal logic stays accurate without re-fetching
  useEffect(() => {
    // Initialize immediately
    setCurrentTimePST(new Date().toISOString());
    
    const interval = setInterval(() => {
      const newTime = new Date().toISOString();
      setCurrentTimePST(newTime);
      console.log('ProfileScreen: Updated currentTimePST:', newTime);
    }, 10 * 1000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    console.log('[API] Requesting /api/my-stats and /api/my-submissions...');
    setLoading(true);
    
    try {
      const [statsData, submissionsData] = await Promise.all([
        authenticatedGet<{
          currentStreak: number;
          longestStreak: number;
          totalSubmissions: number;
          totalWins: number;
          recentSubmissions: { date: string; photoUrl: string; confirmedNumber: number; isWinner: boolean }[];
        }>('/api/my-stats'),
        authenticatedGet<{
          submissions: {
            id: string;
            date: string;
            photoUrl: string;
            confirmedNumber: number;
            targetNumber: number;
            isWinner: boolean;
            latitude: string;
            longitude: string;
            revealTimePST?: string;
          }[];
          currentTimePST?: string;
        }>('/api/my-submissions'),
      ]);

      console.log('[API] /api/my-stats response:', statsData);
      console.log('[API] /api/my-submissions response:', submissionsData);

      setStats({
        currentStreak: statsData.currentStreak,
        longestStreak: statsData.longestStreak,
        totalSubmissions: statsData.totalSubmissions,
        totalWins: statsData.totalWins,
      });
      
      setSubmissions(submissionsData.submissions || []);
      
      // Set initial currentTimePST from backend or use local time
      const initialTime = submissionsData.currentTimePST || new Date().toISOString();
      setCurrentTimePST(initialTime);
      console.log('ProfileScreen: Initial currentTimePST:', initialTime);
    } catch (error) {
      console.error('ProfileScreen: Error fetching user data:', error);
      setStats({ currentStreak: 0, longestStreak: 0, totalSubmissions: 0, totalWins: 0 });
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrizeData = async () => {
    console.log('[API] Requesting /api/prize-claims/eligible and /api/prize-claims/my-claims...');
    setLoadingPrizes(true);
    try {
      const [eligibleData, claimsData] = await Promise.all([
        authenticatedGet<EligiblePrize[]>('/api/prize-claims/eligible'),
        authenticatedGet<PrizeClaim[]>('/api/prize-claims/my-claims'),
      ]);
      console.log('[API] /api/prize-claims/eligible response:', eligibleData);
      console.log('[API] /api/prize-claims/my-claims response:', claimsData);
      setEligiblePrizes(eligibleData || []);
      setPrizeClaims(claimsData || []);
    } catch (error) {
      console.error('ProfileScreen: Error fetching prize data:', error);
      setEligiblePrizes([]);
      setPrizeClaims([]);
    } finally {
      setLoadingPrizes(false);
    }
  };

  const getClaimStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'processing': return 'Processing';
      case 'completed': return 'Paid ✓';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const getClaimStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'processing': return colors.primary;
      case 'completed': return colors.success;
      case 'expired': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getPaymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'paypal': return 'PayPal';
      case 'venmo': return 'Venmo';
      case 'egift': return 'e-Gift Card';
      default: return method;
    }
  };

  const getDaysUntilDeadline = (deadline: string): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  const handleSignOut = async () => {
    console.log('ProfileScreen: User tapped Sign Out button');
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    console.log('[ProfileScreen] User confirmed sign out');
    setShowSignOutModal(false);
    // signOut clears local state immediately in finally block
    // AuthBootstrapGuard will detect user=null and redirect to /auth automatically
    await signOut();
    console.log('[ProfileScreen] User signed out - AuthBootstrapGuard will redirect to /auth');
  };

  const cancelSignOut = () => {
    console.log('ProfileScreen: User cancelled sign out');
    setShowSignOutModal(false);
  };

  const isTargetRevealed = (submission: Submission): boolean => {
    // If no revealTimePST, default to hidden (target not yet revealed)
    // The backend now always sets revealTimePST to 11:59:59 PM PST of the submission day
    if (!submission.revealTimePST) {
      console.log('ProfileScreen: No revealTimePST for submission', submission.id, '- defaulting to hidden');
      return false;
    }
    
    // If no currentTimePST yet, default to hidden
    if (!currentTimePST) {
      console.log('ProfileScreen: No currentTimePST yet - defaulting to hidden');
      return false;
    }
    
    const revealTime = new Date(submission.revealTimePST).getTime();
    const currentTime = new Date(currentTimePST).getTime();
    const revealed = currentTime >= revealTime;
    
    console.log('ProfileScreen: Checking reveal for submission', submission.id, {
      revealTimePST: submission.revealTimePST,
      currentTimePST: currentTimePST,
      revealTime: revealTime,
      currentTime: currentTime,
      revealed: revealed
    });
    
    return revealed;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const streakDisplay = stats?.currentStreak || 0;
  const longestStreakDisplay = stats?.longestStreak || 0;
  const submissionsDisplay = stats?.totalSubmissions || 0;
  const winsDisplay = stats?.totalWins || 0;

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            Platform.OS !== 'ios' && styles.contentWithTabBar
          ]}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <IconSymbol 
                ios_icon_name="person.circle.fill" 
                android_material_icon_name="account-circle" 
                size={80} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="flame.fill" 
                android_material_icon_name="local-fire-department" 
                size={32} 
                color={colors.warning} 
              />
              <Text style={styles.statValue}>{streakDisplay}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="star.fill" 
                android_material_icon_name="star" 
                size={32} 
                color={colors.primary} 
              />
              <Text style={styles.statValue}>{longestStreakDisplay}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
            
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="photo.fill" 
                android_material_icon_name="photo-camera" 
                size={32} 
                color={colors.secondary} 
              />
              <Text style={styles.statValue}>{submissionsDisplay}</Text>
              <Text style={styles.statLabel}>Total Snaps</Text>
            </View>
            
            <View style={styles.statCard}>
              <IconSymbol 
                ios_icon_name="trophy.fill" 
                android_material_icon_name="emoji-events" 
                size={32} 
                color={colors.success} 
              />
              <Text style={styles.statValue}>{winsDisplay}</Text>
              <Text style={styles.statLabel}>Total Wins</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submission History</Text>
            {submissions.length === 0 ? (
              <View style={styles.emptyCard}>
                <IconSymbol 
                  ios_icon_name="photo.fill" 
                  android_material_icon_name="photo-camera" 
                  size={48} 
                  color="rgba(255, 255, 255, 0.6)" 
                />
                <Text style={styles.emptyText}>
                  No submissions yet
                </Text>
                <Text style={styles.emptySubtext}>
                  Start snapping numbers to see your history!
                </Text>
              </View>
            ) : (
              <React.Fragment>
                {submissions.map((submission, index) => {
                  const revealed = isTargetRevealed(submission);
                  const userNumberDisplay = String(submission.confirmedNumber).padStart(6, '0');
                  const targetDisplay = revealed 
                    ? String(submission.targetNumber).padStart(6, '0')
                    : '••••••';
                  const targetLabelDisplay = revealed ? 'Target' : 'Target (Hidden)';
                  
                  return (
                    <View key={index} style={styles.submissionCard}>
                      <Image source={{ uri: submission.photoUrl }} style={styles.submissionImage} />
                      <View style={styles.submissionInfo}>
                        <Text style={styles.submissionDate}>
                          {new Date(submission.date).toLocaleDateString()}
                        </Text>
                        <Text style={styles.submissionNumber}>
                          Your number: {userNumberDisplay}
                        </Text>
                        <Text style={styles.submissionTarget}>
                          {targetLabelDisplay}: {targetDisplay}
                        </Text>
                        {!revealed && (
                          <Text style={styles.revealHint}>
                            Reveals at 11:59 PM PST
                          </Text>
                        )}
                        {submission.isWinner && (
                          <View style={styles.winnerBadge}>
                            <IconSymbol 
                              ios_icon_name="trophy.fill" 
                              android_material_icon_name="emoji-events" 
                              size={16} 
                              color={colors.success} 
                            />
                            <Text style={styles.winnerText}>Winner!</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </React.Fragment>
            )}
          </View>

          {/* Eligible Prizes Section */}
          {(eligiblePrizes.length > 0 || loadingPrizes) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏆 Unclaimed Prizes</Text>
              {loadingPrizes ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                eligiblePrizes.map((prize, index) => {
                  const daysLeft = getDaysUntilDeadline(prize.claimDeadline);
                  return (
                    <View key={index} style={styles.prizeEligibleCard}>
                      <View style={styles.prizeEligibleHeader}>
                        <IconSymbol
                          ios_icon_name="trophy.fill"
                          android_material_icon_name="emoji-events"
                          size={28}
                          color={colors.primary}
                        />
                        <View style={styles.prizeEligibleInfo}>
                          <Text style={styles.prizeEligibleTitle}>
                            You won $25!
                          </Text>
                          <Text style={styles.prizeEligibleDate}>
                            {new Date(prize.date).toLocaleDateString()} · Number: {String(prize.winningNumber).padStart(6, '0')}
                          </Text>
                          <Text style={[styles.prizeDeadline, { color: daysLeft <= 7 ? colors.error : colors.warning }]}>
                            ⏰ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to claim
                          </Text>
                        </View>
                      </View>
                      {prize.canClaim && (
                        <TouchableOpacity
                          style={styles.claimNowButton}
                          onPress={() => {
                            console.log('ProfileScreen: Navigating to claim prize for submission:', prize.submissionId);
                            router.push({
                              pathname: '/claim-prize',
                              params: {
                                submissionId: prize.submissionId,
                                winningNumber: String(prize.winningNumber),
                                prizeAmount: String(prize.prizeAmount),
                              },
                            });
                          }}
                        >
                          <Text style={styles.claimNowButtonText}>Claim Prize →</Text>
                        </TouchableOpacity>
                      )}
                      {!prize.canClaim && (
                        <Text style={styles.alreadyClaimedText}>
                          Already claimed
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Prize Claims History Section */}
          {prizeClaims.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prize Claims</Text>
              {prizeClaims.map((claim, index) => (
                <View key={index} style={styles.prizeClaimCard}>
                  <View style={styles.prizeClaimHeader}>
                    <View style={styles.prizeClaimLeft}>
                      <Text style={styles.prizeClaimAmount}>$25 Prize</Text>
                      <Text style={styles.prizeClaimDate}>
                        Won: {new Date(claim.date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.prizeClaimMethod}>
                        Via: {getPaymentMethodLabel(claim.paymentMethod)}
                      </Text>
                      <Text style={styles.prizeClaimSubmitted}>
                        Claimed: {new Date(claim.claimedAt).toLocaleDateString()}
                      </Text>
                      {claim.processedAt && (
                        <Text style={styles.prizeClaimProcessed}>
                          Processed: {new Date(claim.processedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.claimStatusBadge, { backgroundColor: getClaimStatusColor(claim.claimStatus) + '20', borderColor: getClaimStatusColor(claim.claimStatus) }]}>
                      <Text style={[styles.claimStatusText, { color: getClaimStatusColor(claim.claimStatus) }]}>
                        {getClaimStatusLabel(claim.claimStatus)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <IconSymbol 
              ios_icon_name="arrow.right.square.fill" 
              android_material_icon_name="logout" 
              size={20} 
              color={colors.error} 
            />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showSignOutModal}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sign Out?</Text>
              <Text style={styles.modalSubtitle}>
                Are you sure you want to sign out?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={cancelSignOut}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmSignOut}>
                  <Text style={styles.confirmButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  contentWithTabBar: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFFFFF',
  },
  emptyCard: {
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    color: '#FFFFFF',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  submissionCard: {
    flexDirection: 'row',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submissionImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  submissionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  submissionDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text,
  },
  submissionNumber: {
    fontSize: 14,
    marginBottom: 3,
    color: colors.textSecondary,
  },
  submissionTarget: {
    fontSize: 14,
    marginBottom: 3,
    color: colors.textSecondary,
  },
  revealHint: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
    color: colors.warning,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  winnerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.error,
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
  },
  prizeEligibleCard: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
    backgroundColor: '#FFF9E6',
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prizeEligibleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  prizeEligibleInfo: {
    flex: 1,
  },
  prizeEligibleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.text,
  },
  prizeEligibleDate: {
    fontSize: 13,
    marginBottom: 4,
    color: colors.textSecondary,
  },
  prizeDeadline: {
    fontSize: 13,
    fontWeight: '600',
  },
  claimNowButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  claimNowButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  alreadyClaimedText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    color: colors.textSecondary,
  },
  prizeClaimCard: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prizeClaimHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  prizeClaimLeft: {
    flex: 1,
    marginRight: 10,
  },
  prizeClaimAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.text,
  },
  prizeClaimDate: {
    fontSize: 13,
    marginBottom: 2,
    color: colors.textSecondary,
  },
  prizeClaimMethod: {
    fontSize: 13,
    marginBottom: 2,
    color: colors.textSecondary,
  },
  prizeClaimSubmitted: {
    fontSize: 13,
    marginBottom: 2,
    color: colors.textSecondary,
  },
  prizeClaimProcessed: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  claimStatusBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  claimStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
