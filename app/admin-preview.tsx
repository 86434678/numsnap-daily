
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminPreviewScreen() {
  const router = useRouter();

  const handlePreviewWin = () => {
    console.log('Admin navigating to win preview');
    router.push('/admin-preview-win');
  };

  const handlePreviewPostWin = () => {
    console.log('Admin navigating to post-win preview');
    router.push('/admin-preview-postwin');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Admin Preview',
          headerShown: true,
          headerBackTitle: 'Back',
        }} 
      />
      <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <IconSymbol 
                ios_icon_name="eye.fill" 
                android_material_icon_name="visibility" 
                size={60} 
                color="#FFFFFF" 
              />
              <Text style={styles.headerTitle}>Admin Preview</Text>
              <Text style={styles.headerSubtitle}>Preview app screens and flows</Text>
            </View>

            <View style={styles.previewCard}>
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={handlePreviewWin}
              >
                <View style={styles.previewButtonContent}>
                  <IconSymbol 
                    ios_icon_name="trophy.fill" 
                    android_material_icon_name="emoji-events" 
                    size={32} 
                    color="#FFD700" 
                  />
                  <View style={styles.previewButtonText}>
                    <Text style={styles.previewButtonTitle}>Preview Win Screen</Text>
                    <Text style={styles.previewButtonDescription}>
                      View the winning result reveal screen with confetti
                    </Text>
                  </View>
                  <IconSymbol 
                    ios_icon_name="chevron.right" 
                    android_material_icon_name="chevron-right" 
                    size={24} 
                    color={colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.previewButton}
                onPress={handlePreviewPostWin}
              >
                <View style={styles.previewButtonContent}>
                  <IconSymbol 
                    ios_icon_name="gift.fill" 
                    android_material_icon_name="card-giftcard" 
                    size={32} 
                    color={colors.success} 
                  />
                  <View style={styles.previewButtonText}>
                    <Text style={styles.previewButtonTitle}>Preview Post-Win</Text>
                    <Text style={styles.previewButtonDescription}>
                      View the prize claim submission screen
                    </Text>
                  </View>
                  <IconSymbol 
                    ios_icon_name="chevron.right" 
                    android_material_icon_name="chevron-right" 
                    size={24} 
                    color={colors.textSecondary} 
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <IconSymbol 
                ios_icon_name="info.circle.fill" 
                android_material_icon_name="info" 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.infoText}>
                These previews show sample data and are only accessible to admin users. No purchase necessary.
              </Text>
            </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  previewButton: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  previewButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  previewButtonText: {
    flex: 1,
  },
  previewButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  previewButtonDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
});
