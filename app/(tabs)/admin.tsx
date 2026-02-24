
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput, Platform } from 'react-native';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet, authenticatedPatch } from '@/utils/api';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';

interface Winner {
  winnerId: string;
  submissionId: string;
  userName: string;
  userEmail: string;
  photoUrl: string;
  submissionDate: string;
  snappedNumber: number;
  targetNumber: number;
  latitude: number;
  longitude: number;
  locationSnippet: string;
  prizeClaimId: string | null;
  paymentMethod: string | null;
  paymentInfo: string | null;
  paymentStatus: string;
  claimedAt: string | null;
  expiresAt: string | null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  winnerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  winnerPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  winnerEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  winnerDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  matchBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  matchBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  statusOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextCancel: {
    color: colors.text,
  },
  modalButtonTextSave: {
    color: '#FFFFFF',
  },
  noClaim: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default function AdminScreen() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingClaim, setEditingClaim] = useState<Winner | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      checkAdminAccess();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedGet('/api/admin/check');
      
      if (!response.isAdmin) {
        setError('Admin access only');
        setTimeout(() => {
          router.replace('/(tabs)/(home)/');
        }, 2000);
        return;
      }

      await fetchWinners();
    } catch (err: any) {
      console.error('Admin access check failed:', err);
      setError('Failed to verify admin access');
      setTimeout(() => {
        router.replace('/(tabs)/(home)/');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchWinners = async () => {
    try {
      const data = await authenticatedGet('/api/admin/winners');
      setWinners(data);
    } catch (err: any) {
      console.error('Failed to fetch winners:', err);
      setError('Failed to load winners data');
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') {
      const statusColorPaid = colors.success;
      return statusColorPaid;
    }
    if (statusLower === 'processing') {
      const statusColorProcessing = '#FFA500';
      return statusColorProcessing;
    }
    if (statusLower === 'forfeited') {
      const statusColorForfeited = colors.error;
      return statusColorForfeited;
    }
    const statusColorPending = colors.textSecondary;
    return statusColorPending;
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) {
      const labelNone = 'Not claimed';
      return labelNone;
    }
    const methodLower = method.toLowerCase();
    if (methodLower === 'paypal') {
      const labelPayPal = 'PayPal';
      return labelPayPal;
    }
    if (methodLower === 'venmo') {
      const labelVenmo = 'Venmo';
      return labelVenmo;
    }
    if (methodLower === 'egift') {
      const labelEGift = 'e-Gift Card';
      return labelEGift;
    }
    return method;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return formatted;
  };

  const handleEditStatus = (winner: Winner) => {
    setEditingClaim(winner);
    setSelectedStatus(winner.paymentStatus);
    setNotes('');
  };

  const handleSaveStatus = async () => {
    if (!editingClaim || !editingClaim.prizeClaimId) {
      const errorMessage = 'No claim to update';
      console.error(errorMessage);
      return;
    }

    try {
      setSaving(true);
      
      await authenticatedPatch(`/api/admin/prize-claims/${editingClaim.prizeClaimId}`, {
        paymentStatus: selectedStatus,
        notes: notes || undefined,
      });

      await fetchWinners();
      setEditingClaim(null);
      setSelectedStatus('');
      setNotes('');
    } catch (err: any) {
      console.error('Failed to update payment status:', err);
      setErrorModalMessage('Failed to update payment status. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Verifying admin access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle.fill" 
            android_material_icon_name="warning" 
            size={64} 
            color={colors.error} 
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <Text style={styles.headerSubtitle}>Manage winners and prize claims</Text>
      </View>

      <ScrollView>
        {winners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol 
              ios_icon_name="trophy.fill" 
              android_material_icon_name="emoji-events" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyText}>No winners yet</Text>
          </View>
        ) : (
          winners.map((winner) => {
            const statusColor = getStatusColor(winner.paymentStatus);
            const paymentMethodLabel = getPaymentMethodLabel(winner.paymentMethod);
            const submissionDateFormatted = formatDate(winner.submissionDate);
            const claimedAtFormatted = winner.claimedAt ? formatDate(winner.claimedAt) : null;
            const expiresAtFormatted = winner.expiresAt ? formatDate(winner.expiresAt) : null;

            return (
              <View key={winner.submissionId} style={styles.winnerCard}>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>WINNER</Text>
                </View>

                <View style={styles.winnerHeader}>
                  <Image 
                    source={{ uri: winner.photoUrl }} 
                    style={styles.winnerPhoto}
                    resizeMode="cover"
                  />
                  <View style={styles.winnerInfo}>
                    <Text style={styles.winnerName}>{winner.userName}</Text>
                    <Text style={styles.winnerEmail}>{winner.userEmail}</Text>
                    <Text style={styles.winnerDate}>{submissionDateFormatted}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailLabel}>Snapped Number:</Text>
                  <Text style={styles.detailValue}>{winner.snappedNumber}</Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailLabel}>Target Number:</Text>
                  <Text style={styles.detailValue}>{winner.targetNumber}</Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{winner.locationSnippet}</Text>
                </View>

                <View style={styles.paymentSection}>
                  <Text style={styles.paymentTitle}>Prize Claim</Text>

                  {winner.prizeClaimId ? (
                    <>
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Method:</Text>
                        <Text style={styles.paymentValue}>{paymentMethodLabel}</Text>
                      </View>

                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Details:</Text>
                        <Text style={styles.paymentValue}>{winner.paymentInfo}</Text>
                      </View>

                      {claimedAtFormatted && (
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Claimed:</Text>
                          <Text style={styles.paymentValue}>{claimedAtFormatted}</Text>
                        </View>
                      )}

                      {expiresAtFormatted && (
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Expires:</Text>
                          <Text style={styles.paymentValue}>{expiresAtFormatted}</Text>
                        </View>
                      )}

                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Status:</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                          <Text style={styles.statusText}>{winner.paymentStatus}</Text>
                        </View>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEditStatus(winner)}
                        >
                          <Text style={styles.actionButtonText}>Update Status</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noClaim}>Prize not claimed yet</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={[styles.modalLabel, { marginBottom: 16, fontSize: 15 }]}>{errorModalMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={() => setErrorModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editingClaim !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingClaim(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Payment Status</Text>

            <Text style={styles.modalLabel}>Status:</Text>
            {['Pending', 'Processing', 'Paid', 'Forfeited'].map((status) => {
              const isSelected = selectedStatus === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    isSelected && styles.statusOptionSelected,
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      isSelected && styles.statusOptionTextSelected,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Notes (optional):</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this payment..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditingClaim(null)}
                disabled={saving}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveStatus}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
