
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet } from '@/utils/api';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, runOnJS } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COLORS = ['#FFD700', '#FF6B9D', '#00FF7F', '#4A90E2', '#9B59B6', '#FF4500', '#00BFFF'];

interface ConfettiPieceProps {
  x: number;
  delay: number;
  color: string;
  size: number;
}

function ConfettiPiece({ x, delay, color, size }: ConfettiPieceProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(SCREEN_HEIGHT + 50, { duration: 3000, easing: Easing.linear }));
    translateX.value = withDelay(delay, withTiming((Math.random() - 0.5) * 200, { duration: 3000 }));
    rotate.value = withDelay(delay, withTiming(Math.random() * 720, { duration: 3000 }));
    opacity.value = withDelay(delay + 2000, withTiming(0, { duration: 1000 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: 0,
          width: size,
          height: size * 0.6,
          backgroundColor: color,
          borderRadius: 2,
        },
        animStyle,
      ]}
    />
  );
}

function ConfettiAnimation() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 1500,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 10 + 6,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} x={p.x} delay={p.delay} color={p.color} size={p.size} />
      ))}
    </View>
  );
}

interface RevealData {
  isMatch: boolean;
  userNumber: number;
  targetNumber: string;
  submissionTime: string;
  userName: string;
}

export default function RevealResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [error, setError] = useState<string>('');

  console.log('RevealResultScreen: Loading reveal data, params:', params);

  useEffect(() => {
    // If revealData was passed as params from confirm-submission, use it directly
    if (params.isMatch !== undefined && params.userNumber && params.targetNumber && params.submissionTime && params.userName) {
      console.log('RevealResultScreen: Using revealData from params');
      setRevealData({
        isMatch: params.isMatch === 'true',
        userNumber: parseInt(params.userNumber as string, 10),
        targetNumber: params.targetNumber as string,
        submissionTime: params.submissionTime as string,
        userName: params.userName as string,
      });
      setLoading(false);
    } else {
      // Otherwise fetch from API (e.g. user navigated directly from home screen)
      fetchRevealData();
    }
  }, []);

  const fetchRevealData = async () => {
    console.log('[API] Requesting /api/reveal-result...');
    setLoading(true);
    try {
      const data = await authenticatedGet<RevealData>('/api/reveal-result');
      console.log('[API] /api/reveal-result response:', data);
      setRevealData(data);
    } catch (err: any) {
      console.error('RevealResultScreen: Error fetching reveal data:', err);
      const message = err?.message || 'Failed to load results. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your results...</Text>
      </View>
    );
  }

  if (error || !revealData) {
    const errorMessage = error || 'No submission found for today.';
    return (
      <View style={[styles.container, styles.centerContent]}>
        <IconSymbol 
          ios_icon_name="exclamationmark.circle.fill" 
          android_material_icon_name="error" 
          size={60} 
          color={colors.error} 
        />
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  const userNumberDisplay = String(revealData.userNumber).padStart(6, '0');
  const submissionDate = new Date(revealData.submissionTime);
  const timeDisplay = submissionDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const dateDisplay = submissionDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <View style={styles.container}>
      {revealData.isMatch && <ConfettiAnimation />}
      
      <LinearGradient
        colors={revealData.isMatch ? ['#00FF7F', '#00CC66'] : [colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'android' ? 48 : 20 }]}
        >
          {/* Result Header */}
          <View style={styles.header}>
            {revealData.isMatch ? (
              <>
                <IconSymbol 
                  ios_icon_name="trophy.fill" 
                  android_material_icon_name="emoji-events" 
                  size={80} 
                  color="#FFD700" 
                />
                <Text style={styles.winTitle}>WINNER!</Text>
                <Text style={styles.winSubtitle}>Congratulations! You matched the number!</Text>
              </>
            ) : (
              <>
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={80} 
                  color="#FFFFFF" 
                />
                <Text style={styles.noMatchTitle}>No Match</Text>
                <Text style={styles.noMatchSubtitle}>Better luck tomorrow!</Text>
              </>
            )}
          </View>

          {/* Your Number */}
          <View style={styles.resultCard}>
            <Text style={styles.cardLabel}>Your Snap:</Text>
            <View style={styles.numberContainer}>
              <Text style={styles.number}>{userNumberDisplay}</Text>
            </View>
          </View>

          {/* Target Number Reveal */}
          <View style={styles.resultCard}>
            {revealData.isMatch ? (
              <>
                <Text style={styles.cardLabel}>Today&apos;s Number:</Text>
                <View style={[styles.numberContainer, styles.matchContainer]}>
                  <Text style={styles.number}>{revealData.targetNumber}</Text>
                </View>
                <Text style={styles.matchText}>Perfect Match! 🎉</Text>
              </>
            ) : (
              <>
                <Text style={styles.noMatchMessage}>
                  Your snap: {userNumberDisplay}. No match!
                </Text>
                <Text style={styles.cardLabel}>Today&apos;s number ended with:</Text>
                <View style={styles.partialContainer}>
                  <Text style={styles.partialNumber}>{revealData.targetNumber}</Text>
                </View>
                <Text style={styles.hintText}>Better luck tomorrow! Full number revealed then.</Text>
              </>
            )}
          </View>

          {/* Prize Info */}
          {revealData.isMatch && (
            <View style={styles.prizeCard}>
              <Text style={styles.prizeAmount}>$25</Text>
              <Text style={styles.prizeLabel}>Prize Won!</Text>
              <Text style={styles.prizeSubtext}>You&apos;ll be contacted via email within 24 hours</Text>
            </View>
          )}

          {/* Watermark */}
          <View style={styles.watermarkCard}>
            <IconSymbol 
              ios_icon_name="person.fill" 
              android_material_icon_name="person" 
              size={16} 
              color={colors.textSecondary} 
            />
            <Text style={styles.watermarkText}>
              Your result only – {revealData.userName} – {timeDisplay} on {dateDisplay}
            </Text>
          </View>

          {/* Back Button */}
          <View style={styles.buttonContainer}>
            <Text style={styles.backButtonText} onPress={() => router.replace('/')}>
              Back to Home
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  winTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  winSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
  },
  noMatchTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
  },
  noMatchSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 15,
    fontWeight: '600',
  },
  numberContainer: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  matchContainer: {
    backgroundColor: colors.success,
  },
  number: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  matchText: {
    fontSize: 18,
    color: colors.success,
    marginTop: 15,
    fontWeight: 'bold',
  },
  partialContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  partialNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  noMatchMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  prizeCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  prizeAmount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  prizeLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 5,
  },
  prizeSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
    textAlign: 'center',
  },
  watermarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  watermarkText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});
