import { pgTable, uuid, text, timestamp, integer, date, boolean, numeric } from 'drizzle-orm/pg-core';

export const dailyNumbers = pgTable('daily_numbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetNumber: integer('target_number').notNull(),
  date: date('date').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  photoUrl: text('photo_url').notNull(),
  detectedNumber: integer('detected_number').notNull(),
  confirmedNumber: integer('confirmed_number').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  city: text('city'),
  isManualEntry: boolean('is_manual_entry').default(false).notNull(),
  submissionDate: date('submission_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revealTimePST: timestamp('reveal_time_pst', { withTimezone: true }),
  isWinner: boolean('is_winner').default(false).notNull(),
});

export const userStats = pgTable('user_stats', {
  userId: text('user_id').primaryKey(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  totalSubmissions: integer('total_submissions').default(0).notNull(),
  totalWins: integer('total_wins').default(0).notNull(),
  lastSubmissionDate: date('last_submission_date'),
});

export const prizeClaims = pgTable('prize_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  submissionId: uuid('submission_id').notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentInfo: text('payment_info').notNull(),
  confirmedAccuracy: boolean('confirmed_accuracy').notNull(),
  claimStatus: text('claim_status').default('pending').notNull(),
  claimedAt: timestamp('claimed_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
