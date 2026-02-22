
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useTheme } from '@react-navigation/native';

export default function RulesScreen() {
  const { colors: themeColors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'android' ? 48 : 0 }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="info.circle.fill" 
            android_material_icon_name="info" 
            size={60} 
            color={colors.primary} 
          />
          <Text style={[styles.title, { color: themeColors.text }]}>Official Rules</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>How to Play</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            1. Each day at midnight UTC, a new random 6-digit target number (0-999999) is generated.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            2. Take ONE photo per day of any number you find in the real world (house numbers, license plates, receipts, signs, barcodes, etc.).
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            3. Our AI will detect the number in your photo. You can confirm or edit it before submitting.
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            4. If your number exactly matches the daily target number, you win $25!
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            5. If no one matches the number that day, there is no winner and no payout.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Rules & Restrictions</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • One submission per user per day
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Location services must be enabled for entry verification
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Photos must be taken in real-world settings (no screenshots or digital displays)
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Winners are determined at the end of each day (midnight UTC)
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Multiple winners split the prize equally if more than one person matches
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>No Purchase Necessary</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            This is a free-to-play sweepstakes. No purchase is necessary to enter or win. Entry is free and open to all registered users.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Eligibility</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Must be 18 years or older to participate
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Void where prohibited by law
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Employees and immediate family members of NumSnap Daily are not eligible
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Prize Information</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Daily prize: $25 USD
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Winners will be notified via email within 24 hours
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Prizes are paid via electronic transfer or check
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Winners are responsible for any applicable taxes
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Anti-Fraud Measures</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We use GPS verification, photo metadata analysis, and AI detection to prevent fraud. Any suspicious activity may result in disqualification and account termination.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Privacy & Data</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Your photos and location data are used solely for entry verification and fraud prevention. We do not sell or share your personal information with third parties.
          </Text>
        </View>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          By participating, you agree to these official rules and our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
  },
  section: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
