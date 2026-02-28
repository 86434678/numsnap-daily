
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface HistoryEntry {
  id: string;
  date: string;
  photoUrl: string;
  confirmedNumber: number;
  targetNumber: number;
  isWinner: boolean;
  createdAt: string;
}

function resolveImageSource(source: string | number | undefined): { uri: string } | number {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as number;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (!user) return;
    
    console.log('[History] Fetching history entries...');
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const data = await authenticatedGet<HistoryEntry[]>('/api/history');
      console.log('[History] Fetched entries:', data.length);
      setEntries(data);
    } catch (err) {
      console.error('[History] Error fetching history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        </LinearGradient>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.gradient}
        >
          <View style={styles.errorContainer}>
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="error" 
              size={64} 
              color={colors.error} 
            />
            <Text style={styles.errorTitle}>Error Loading History</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchHistory()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </>
    );
  }

  const emptyStateVisible = entries.length === 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Your past daily entries</Text>
          </View>

          {emptyStateVisible ? (
            <View style={styles.emptyState}>
              <IconSymbol 
                ios_icon_name="photo.fill" 
                android_material_icon_name="photo-camera" 
                size={80} 
                color="rgba(255, 255, 255, 0.3)" 
              />
              <Text style={styles.emptyStateTitle}>No Entries Yet</Text>
              <Text style={styles.emptyStateText}>
                Start snapping numbers to build your history!
              </Text>
            </View>
          ) : (
            <View style={styles.entriesContainer}>
              {entries.map((entry) => {
                const dateDisplay = formatDate(entry.date);
                const statusText = entry.isWinner ? 'Winner!' : 'No Match';
                const statusColor = entry.isWinner ? colors.success : colors.textSecondaryDark;
                
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <Image 
                      source={resolveImageSource(entry.photoUrl)} 
                      style={styles.entryImage}
                      resizeMode="cover"
                    />
                    <View style={styles.entryDetails}>
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryDate}>{dateDisplay}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: entry.isWinner ? 'rgba(0, 204, 102, 0.2)' : 'rgba(255, 255, 255, 0.1)' }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {statusText}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.numbersRow}>
                        <View style={styles.numberContainer}>
                          <Text style={styles.numberLabel}>Your Number</Text>
                          <Text style={styles.numberValue}>{entry.confirmedNumber}</Text>
                        </View>
                        <IconSymbol 
                          ios_icon_name="arrow.right" 
                          android_material_icon_name="arrow-forward" 
                          size={20} 
                          color="rgba(255, 255, 255, 0.5)" 
                        />
                        <View style={styles.numberContainer}>
                          <Text style={styles.numberLabel}>Target</Text>
                          <Text style={styles.numberValue}>{entry.targetNumber}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondaryDark,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondaryDark,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondaryDark,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  entriesContainer: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  entryImage: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  entryDetails: {
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numberContainer: {
    flex: 1,
    alignItems: 'center',
  },
  numberLabel: {
    fontSize: 12,
    color: colors.textSecondaryDark,
    marginBottom: 4,
  },
  numberValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    fontFamily: 'Courier',
  },
});
