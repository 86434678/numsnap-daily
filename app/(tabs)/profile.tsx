
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
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
  const [loading, setLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  console.log('ProfileScreen: User:', user?.email);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

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
          id: string;
          date: string;
          photoUrl: string;
          confirmedNumber: number;
          targetNumber: number;
          isWinner: boolean;
          latitude: string;
          longitude: string;
        }[]>('/api/my-submissions'),
      ]);

      console.log('[API] /api/my-stats response:', statsData);
      console.log('[API] /api/my-submissions response:', submissionsData);

      setStats({
        currentStreak: statsData.currentStreak,
        longestStreak: statsData.longestStreak,
        totalSubmissions: statsData.totalSubmissions,
        totalWins: statsData.totalWins,
      });
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('ProfileScreen: Error fetching user data:', error);
      setStats({ currentStreak: 0, longestStreak: 0, totalSubmissions: 0, totalWins: 0 });
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
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
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          Platform.OS !== 'ios' && styles.contentWithTabBar
        ]}
      >
        {/* Header */}
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

        {/* Stats Grid */}
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

        {/* Submission History */}
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
              {submissions.map((submission, index) => (
                <View key={index} style={[styles.submissionCard, { backgroundColor: colors.card }]}>
                  <Image source={{ uri: submission.photoUrl }} style={styles.submissionImage} />
                  <View style={styles.submissionInfo}>
                    <Text style={[styles.submissionDate, { color: themeColors.text }]}>
                      {new Date(submission.date).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.submissionNumber, { color: colors.textSecondary }]}>
                      Your number: {submission.confirmedNumber}
                    </Text>
                    <Text style={[styles.submissionTarget, { color: colors.textSecondary }]}>
                      Target: {submission.targetNumber}
                    </Text>
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
              ))}
            </React.Fragment>
          )}
        </View>

        {/* Sign Out Button */}
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

      {/* Sign Out Confirmation Modal */}
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
    elevation: 3,
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
  },
  submissionNumber: {
    fontSize: 14,
    marginBottom: 3,
  },
  submissionTarget: {
    fontSize: 14,
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
