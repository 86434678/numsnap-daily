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
