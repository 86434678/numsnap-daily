
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useTheme } from '@react-navigation/native';
import { apiGet } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';

interface Winner {
  userName: string;
  date: string;
  winningNumber: number;
}

export default function WinnersScreen() {
  const { colors: themeColors } = useTheme();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('WinnersScreen: Component mounted');

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    console.log('[API] Requesting /api/recent-winners...');
    setLoading(true);
    
    try {
      const data = await apiGet<{ userName: string; date: string; winningNumber: number }[]>(
        '/api/recent-winners'
      );
      console.log('[API] /api/recent-winners response:', data);
      setWinners(data || []);
    } catch (error) {
      console.error('WinnersScreen: Error fetching winners:', error);
      setWinners([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <IconSymbol 
              ios_icon_name="trophy.fill" 
              android_material_icon_name="emoji-events" 
              size={60} 
              color="#FFFFFF" 
            />
            <Text style={styles.title}>Recent Winners</Text>
            <Text style={styles.subtitle}>
              Congratulations to our lucky winners!
            </Text>
          </View>

          {winners.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <IconSymbol 
                ios_icon_name="star.fill" 
                android_material_icon_name="star" 
                size={48} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No winners yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Be the first to match the daily number!
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {winners.map((winner, index) => {
                const winnerName = winner.userName;
                const winnerDate = new Date(winner.date).toLocaleDateString();
                const winningNumber = String(winner.winningNumber).padStart(6, '0');
                
                return (
                  <View key={index} style={[styles.winnerCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.winnerInfo}>
                      <Text style={[styles.winnerName, { color: colors.text }]}>
                        {winnerName}
                      </Text>
                      <Text style={[styles.winnerDate, { color: colors.textSecondary }]}>
                        {winnerDate}
                      </Text>
                      <View style={styles.numberBadge}>
                        <Text style={styles.numberText}>
                          {winningNumber}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol 
                      ios_icon_name="trophy.fill" 
                      android_material_icon_name="emoji-events" 
                      size={32} 
                      color={colors.success} 
                    />
                  </View>
                );
              })}
            </React.Fragment>
          )}
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
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
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  winnerDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  numberBadge: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  numberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
