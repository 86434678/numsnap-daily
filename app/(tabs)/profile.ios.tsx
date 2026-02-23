
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    console.log('ProfileScreen: User confirmed sign out');
    setShowSignOutModal(false);
    try {
      await signOut();
      console.log('ProfileScreen: User signed out successfully');
      router.replace('/auth');
    } catch (error) {
      console.error('ProfileScreen: Error signing out:', error);
    }
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
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const streakDisplay = stats?.currentStreak || 0;
  const longestStreakDisplay = stats?.longestStreak || 0;
  const submissionsDisplay = stats?.totalSubmissions || 0;
  const winsDisplay = stats?.totalWins || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol 
              ios_icon_name="person.circle.fill" 
              android_material_icon_name="account-circle" 
              size={80} 
              color={colors.primary} 
            />
          </View>
          <Text style={[styles.email, { color: themeColors.text }]}>{user?.email}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol 
              ios_icon_name="flame.fill" 
              android_material_icon_name="local-fire-department" 
              size={32} 
              color={colors.warning} 
            />
            <Text style={[styles.statValue, { color: themeColors.text }]}>{streakDisplay}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol 
              ios_icon_name="star.fill" 
              android_material_icon_name="star" 
              size={32} 
              color={colors.primary} 
            />
            <Text style={[styles.statValue, { color: themeColors.text }]}>{longestStreakDisplay}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Longest Streak</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol 
              ios_icon_name="photo.fill" 
              android_material_icon_name="photo-camera" 
              size={32} 
              color={colors.secondary} 
            />
            <Text style={[styles.statValue, { color: themeColors.text }]}>{submissionsDisplay}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Snaps</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol 
              ios_icon_name="trophy.fill" 
              android_material_icon_name="emoji-events" 
              size={32} 
              color={colors.success} 
            />
            <Text style={[styles.statValue, { color: themeColors.text }]}>{winsDisplay}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Wins</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Submission History</Text>
          {submissions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <IconSymbol 
                ios_icon_name="photo.fill" 
                android_material_icon_name="photo-camera" 
                size={48} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No submissions yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
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
                  <View key={index} style={[styles.submissionCard, { backgroundColor: colors.card }]}>
                    <Image source={{ uri: submission.photoUrl }} style={styles.submissionImage} />
                    <View style={styles.submissionInfo}>
                      <Text style={[styles.submissionDate, { color: themeColors.text }]}>
                        {new Date(submission.date).toLocaleDateString()}
                      </Text>
                      <Text style={[styles.submissionNumber, { color: colors.textSecondary }]}>
                        Your number: {userNumberDisplay}
                      </Text>
                      <Text style={[styles.submissionTarget, { color: colors.textSecondary }]}>
                        {targetLabelDisplay}: {targetDisplay}
                      </Text>
                      {!revealed && (
                        <Text style={[styles.revealHint, { color: colors.warning }]}>
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
                          <Text style={[styles.winnerText, { color: colors.success }]}>Winner!</Text>
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
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>🏆 Unclaimed Prizes</Text>
            {loadingPrizes ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              eligiblePrizes.map((prize, index) => {
                const daysLeft = getDaysUntilDeadline(prize.claimDeadline);
                return (
                  <View key={index} style={[styles.prizeEligibleCard, { backgroundColor: '#FFF9E6', borderColor: colors.primary }]}>
                    <View style={styles.prizeEligibleHeader}>
                      <IconSymbol
                        ios_icon_name="trophy.fill"
                        android_material_icon_name="emoji-events"
                        size={28}
                        color={colors.primary}
                      />
                      <View style={styles.prizeEligibleInfo}>
                        <Text style={[styles.prizeEligibleTitle, { color: colors.text }]}>
                          You won $25!
                        </Text>
                        <Text style={[styles.prizeEligibleDate, { color: colors.textSecondary }]}>
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
                      <Text style={[styles.alreadyClaimedText, { color: colors.textSecondary }]}>
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
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Prize Claims</Text>
            {prizeClaims.map((claim, index) => (
              <View key={index} style={[styles.prizeClaimCard, { backgroundColor: colors.card }]}>
                <View style={styles.prizeClaimHeader}>
                  <View style={styles.prizeClaimLeft}>
                    <Text style={[styles.prizeClaimAmount, { color: themeColors.text }]}>$25 Prize</Text>
                    <Text style={[styles.prizeClaimDate, { color: colors.textSecondary }]}>
                      Won: {new Date(claim.date).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.prizeClaimMethod, { color: colors.textSecondary }]}>
                      Via: {getPaymentMethodLabel(claim.paymentMethod)}
                    </Text>
                    <Text style={[styles.prizeClaimSubmitted, { color: colors.textSecondary }]}>
                      Claimed: {new Date(claim.claimedAt).toLocaleDateString()}
                    </Text>
                    {claim.processedAt && (
                      <Text style={[styles.prizeClaimProcessed, { color: colors.success }]}>
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
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sign Out?</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={cancelSignOut}>
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmSignOut}>
                <Text style={styles.confirmButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyCard: {
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  submissionCard: {
    flexDirection: 'row',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  },
  submissionNumber: {
    fontSize: 14,
    marginBottom: 3,
  },
  submissionTarget: {
    fontSize: 14,
    marginBottom: 3,
  },
  revealHint: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
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
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  prizeEligibleCard: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  },
  prizeEligibleDate: {
    fontSize: 13,
    marginBottom: 4,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alreadyClaimedText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  prizeClaimCard: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  },
  prizeClaimDate: {
    fontSize: 13,
    marginBottom: 2,
  },
  prizeClaimMethod: {
    fontSize: 13,
    marginBottom: 2,
  },
  prizeClaimSubmitted: {
    fontSize: 13,
    marginBottom: 2,
  },
  prizeClaimProcessed: {
    fontSize: 13,
    fontWeight: '600',
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
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
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
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
