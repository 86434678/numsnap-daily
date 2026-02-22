import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// NumSnap Daily - Vibrant, fun color palette
export const colors = {
  // Gradient background colors
  gradientStart: '#4A90E2', // Fun blue
  gradientEnd: '#9B59B6', // Purple
  
  // Primary colors
  primary: '#FFD700', // Bright yellow (camera lens)
  secondary: '#00FF7F', // Glowing green (number)
  accent: '#FF6B9D', // Pink accent
  
  // UI colors
  background: '#FFFFFF',
  backgroundDark: '#1A1A2E',
  backgroundAlt: '#F0F0F0',
  card: '#F8F9FA',
  cardDark: '#2D2D44',
  
  // Text colors
  text: '#2C3E50',
  textDark: '#FFFFFF',
  textSecondary: '#7F8C8D',
  textSecondaryDark: '#BDC3C7',
  
  // Status colors
  success: '#00CC66',
  error: '#E74C3C',
  warning: '#F39C12',
  
  // Special effects
  neonGlow: '#00FF7F',
  confetti: ['#FFD700', '#FF6B9D', '#00FF7F', '#4A90E2', '#9B59B6'],
  
  // Legacy aliases
  grey: '#7F8C8D',
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.grey,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: "white",
  },
});
