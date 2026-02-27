
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';

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

  React.useEffect(() => {
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

export default function AdminPreviewWinScreen() {
  const router = useRouter();

  const dummyNumber = '123456';
  const dummyUserName = 'Preview User';
  const dummyTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dummyDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={styles.container}>
      <ConfettiAnimation />
      
      <LinearGradient
        colors={['#00FF7F', '#00CC66']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'android' ? 48 : 20 }]}
        >
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>PREVIEW MODE</Text>
          </View>

          <View style={styles.header}>
            <IconSymbol 
              ios_icon_name="trophy.fill" 
              android_material_icon_name="emoji-events" 
              size={80} 
              color="#FFD700" 
            />
            <Text style={styles.winTitle}>WINNER!</Text>
            <Text style={styles.winSubtitle}>Congratulations! You matched the number!</Text>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.cardLabel}>Your Snap:</Text>
            <View style={styles.numberContainer}>
              <Text style={styles.number}>{dummyNumber}</Text>
            </View>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.cardLabel}>Today&apos;s Number:</Text>
            <View style={[styles.numberContainer, styles.matchContainer]}>
              <Text style={styles.number}>{dummyNumber}</Text>
            </View>
            <Text style={styles.matchText}>Perfect Match! 🎉</Text>
          </View>

          <View style={styles.prizeCard}>
            <Text style={styles.prizeAmount}>$25</Text>
            <Text style={styles.prizeLabel}>Prize Won!</Text>
            <Text style={styles.prizeSubtext}>Tap below to claim your prize</Text>
          </View>

          <TouchableOpacity 
            style={styles.claimButton}
            onPress={() => console.log('[Admin Preview] Claim button tapped (dummy)')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.claimButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconSymbol 
                ios_icon_name="gift.fill" 
                android_material_icon_name="card-giftcard" 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.claimButtonText}>Claim Your Prize</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.watermarkCard}>
            <IconSymbol 
              ios_icon_name="person.fill" 
              android_material_icon_name="person" 
              size={16} 
              color={colors.textSecondary} 
            />
            <Text style={styles.watermarkText}>
              Your result only – {dummyUserName} – {dummyTime} on {dummyDate}
            </Text>
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol 
              ios_icon_name="arrow.left" 
              android_material_icon_name="arrow-back" 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.backButtonText}>Back to Admin Preview</Text>
          </TouchableOpacity>
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
  previewBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    padding: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  claimButton: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  claimButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    gap: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
