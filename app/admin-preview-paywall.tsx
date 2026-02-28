
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminPreviewPaywallScreen() {
  const router = useRouter();

  const handleClose = () => {
    console.log('Admin closing paywall preview');
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Paywall Preview',
          headerShown: true,
          headerBackTitle: 'Back',
        }} 
      />
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
        <LinearGradient
          colors={['#6B46C1', '#9333EA', '#C026D3']}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <View style={styles.adminBadge}>
              <IconSymbol 
                ios_icon_name="eye.fill" 
                android_material_icon_name="visibility" 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.adminBadgeText}>ADMIN PREVIEW</Text>
            </View>

            <View style={styles.header}>
              <IconSymbol 
                ios_icon_name="crown.fill" 
                android_material_icon_name="workspace-premium" 
                size={80} 
                color="#FFD700" 
              />
              <Text style={styles.title}>Go Premium</Text>
              <Text style={styles.subtitle}>Unlock exclusive features and benefits</Text>
            </View>

            <View style={styles.featuresCard}>
              <View style={styles.featureItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle" 
                  size={28} 
                  color={colors.success} 
                />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Ad-Free Experience</Text>
                  <Text style={styles.featureDescription}>
                    Enjoy the app without any interruptions
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle" 
                  size={28} 
                  color={colors.success} 
                />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Advanced Statistics</Text>
                  <Text style={styles.featureDescription}>
                    Track your performance with detailed analytics
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle" 
                  size={28} 
                  color={colors.success} 
                />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Custom Themes</Text>
                  <Text style={styles.featureDescription}>
                    Personalize your app with exclusive themes
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill" 
                  android_material_icon_name="check-circle" 
                  size={28} 
                  color={colors.success} 
                />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Priority Support</Text>
                  <Text style={styles.featureDescription}>
                    Get help faster with dedicated support
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.pricingCard}>
              <Text style={styles.pricingTitle}>Premium Subscription</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>$4.99</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>
              <Text style={styles.pricingNote}>Cancel anytime • No commitment</Text>
            </View>

            <TouchableOpacity 
              style={styles.subscribeButton}
              onPress={handleClose}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.subscribeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <IconSymbol 
                  ios_icon_name="crown.fill" 
                  android_material_icon_name="workspace-premium" 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.restoreButton}
              onPress={handleClose}
            >
              <Text style={styles.restoreButtonText}>Restore Purchase</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              This is a preview screen. No actual subscription will be charged.
            </Text>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </>
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
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  featuresCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pricingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  pricePeriod: {
    fontSize: 20,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  pricingNote: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  subscribeButton: {
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  subscribeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  subscribeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
