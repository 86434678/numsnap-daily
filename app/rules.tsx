
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function RulesScreen() {
  const { colors: themeColors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Official Rules', headerShown: true }} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
      >
        <SafeAreaView style={[styles.container, { paddingTop: Platform.OS === 'android' ? 48 : 0 }]} edges={['top']}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <IconSymbol 
                ios_icon_name="info.circle.fill" 
                android_material_icon_name="info" 
                size={60} 
                color="#FFFFFF" 
              />
              <Text style={styles.title}>Official Rules</Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sponsor</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Sponsor: SnapForge Apps
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Contact: contact@snapforgeapps.com
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>How to Play</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                1. Each day at midnight PST (Pacific Standard Time), a new random 6-digit target number (0-999999) is generated and kept hidden.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                2. Take ONE photo per day of any number you find in the real world (house numbers, license plates, receipts, signs, barcodes, etc.).
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                3. Our AI will detect the number in your photo. You can confirm or edit it before submitting.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                4. After submission, you&apos;ll see your result immediately:
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • If you match: Full number revealed with confetti! You win $25!
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • If you don&apos;t match: Only the last 3 digits are revealed (e.g., &quot;...789&quot;). Better luck tomorrow!
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                5. If no one matches the number that day, there is no winner and no payout.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Odds of Winning</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Odds of winning depend on the number of eligible entries received for that daily challenge.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Optional Hints</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Users may watch short ads for hints to help guess the target number (e.g., a range or higher/lower indication). Watching ads is optional and does not increase your chances of winning beyond what&apos;s available through free methods.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                No purchase or ad view is necessary to enter or win; hints are provided as a convenience and do not affect core entry odds or sweepstakes rules.
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • Hints are limited to 2 per daily challenge
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • Hints are only available during the active PST countdown period
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • Hints provide vague information (e.g., number ranges) and do not guarantee a win
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Timing & Time Zone</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                All daily challenge timing operates in Pacific Standard Time (PST, UTC-8):
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • Daily reset: Midnight PST
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • Submission window: 24 hours from midnight PST
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • Target number reveal: After the daily period ends (midnight PST)
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                All countdown timers and reveal times displayed in the app are in PST.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Number Reveal System</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                The daily target number is hidden until after you submit your entry. This ensures fair play and prevents cheating.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • The daily target number is generated prior to the start of each entry period using a randomization process and cannot be altered once generated.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Winners see the full number immediately with a celebration screen
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Non-winners see only the last 3 digits as a hint
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Your result includes a watermark with your username and submission time for verification
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • The full number for non-matches is revealed after midnight PST the next day
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Rules & Restrictions</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • One submission per user per day
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Location services must be enabled for entry verification
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Entries must be submitted from within the continental United States. Entries from Alaska, Hawaii, U.S. territories, or outside the U.S. are not eligible.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Photos must be taken in real-world settings (no screenshots or digital displays)
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Winners are determined immediately upon submission
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Multiple winners split the prize equally if more than one person matches
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>No Purchase Necessary</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                This is a free-to-play sweepstakes. No purchase is necessary to enter or win. Entry is free and open to all registered users. Watching ads for hints is optional and does not increase your chances of winning beyond what is available through free methods.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Eligibility</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Must be 18 years of age or older at time of entry
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Age is self-declared and verified via in-app age gate
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • False declaration may result in disqualification
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Must be physically located in the continental United States at the time of submission
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Void where prohibited by law
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Employees and immediate family members of NumSnap Daily are not eligible
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Prize Information</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • The total daily prize pool is $25 USD.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • If more than one verified participant matches the target number, the $25 prize will be divided equally among all winners.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Winners will be notified in-app and via email within 24 hours
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Winners must claim their prize within 30 days or it will be forfeited
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Winners are responsible for any applicable taxes
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>How Winners Are Paid</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Prizes are paid via privacy-friendly payment methods. No bank account details are required.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Payment options:
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • PayPal: Provide your PayPal email, username, or PayPal.Me link
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • Venmo: Provide your Venmo username or handle
              </Text>
              <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
                • Digital e-Gift Card: We&apos;ll email you a $25 Visa or Amazon e-gift code
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Winners provide their payment information on the claim form. Prizes are processed manually within 7 business days.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification & Disqualification</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Sponsor reserves the right to verify identity, eligibility, and compliance before awarding any prize.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Sponsor may disqualify any participant suspected of fraud, tampering, automation, abuse, or rule violations.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Failure to provide requested verification may result in forfeiture.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Anti-Fraud Measures</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                We use GPS verification, photo metadata analysis, AI detection, geographic restrictions, and partial number reveals to prevent fraud. Any suspicious activity may result in disqualification and account termination.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Limitation of Liability</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Sponsor is not responsible for lost, late, incomplete, invalid, or misdirected entries.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Sponsor is not responsible for technical failures, system errors, downtime, GPS inaccuracies, AI misreads, interrupted connections, or unauthorized interference.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Sponsor is not responsible for delays involving payment processors or third-party services.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Right to Modify or Terminate</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Sponsor reserves the right to cancel, suspend, or modify the Promotion if fraud, technical failures, or other issues impair integrity or proper functioning.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Updates will be reflected in revised Official Rules within the app.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy & Data</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • We do not sell your personal information.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • Information may be shared with trusted service providers solely to operate the Promotion (payment processing, fraud prevention, hosting, analytics).
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Governing Law</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                • This Promotion is governed by the laws of the State of Idaho, without regard to conflict of law principles.
              </Text>
            </View>

            <Text style={styles.footer}>
              By participating, you agree to these official rules and our Terms of Service and Privacy Policy.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
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
    color: '#FFFFFF',
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
  bulletPoint: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 10,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
    color: '#FFFFFF',
  },
});
