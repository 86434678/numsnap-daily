import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import * as authSchema from '../db/schema/auth-schema.js';
import type { App } from '../index.js';
import { getTodayPST, formatAsPST } from '../utils/timezone.js';

export function registerPrizeRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // PATCH /api/user/verify-age - Verify user is 18 or older
  app.fastify.patch('/api/user/verify-age', {
    schema: {
      description: 'Verify user is 18 years or older',
      tags: ['user', 'age-verification'],
      body: {
        type: 'object',
        required: ['ageVerified'],
        properties: {
          ageVerified: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            ageVerified: { type: 'boolean' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { ageVerified: boolean } }>,
    reply: FastifyReply
  ): Promise<{ success: boolean; ageVerified: boolean } | void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    const { ageVerified } = request.body;

    app.logger.info({ userId, ageVerified }, 'Updating age verification');

    try {
      // Only allow setting to true (age verification is one-way)
      if (!ageVerified) {
        return reply.status(400).send({ error: 'Age verification cannot be revoked' });
      }

      // Update user age_verified flag
      await app.db
        .update(authSchema.user)
        .set({ ageVerified: true })
        .where(eq(authSchema.user.id, userId));

      app.logger.info({ userId }, 'Age verification completed');

      return {
        success: true,
        ageVerified: true,
      };
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to update age verification');
      throw error;
    }
  });

  // GET /api/user/age-status - Get user's age verification status
  app.fastify.get('/api/user/age-status', {
    schema: {
      description: 'Get current user\'s age verification status',
      tags: ['user', 'age-verification'],
      response: {
        200: {
          type: 'object',
          properties: {
            ageVerified: { type: 'boolean' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<{ ageVerified: boolean } | void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    app.logger.info({ userId }, 'Fetching age verification status');

    try {
      const user = await app.db.query.user.findFirst({
        where: eq(authSchema.user.id, userId),
      });

      if (!user) {
        app.logger.warn({ userId }, 'User not found');
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        ageVerified: Boolean(user.ageVerified) || false,
      };
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to fetch age verification status');
      throw error;
    }
  });

  // GET /api/prize-claims/eligible - Get eligible winning submissions for claiming
  app.fastify.get('/api/prize-claims/eligible', {
    schema: {
      description: 'Get user\'s eligible winning submissions for prize claiming',
      tags: ['prizes'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              submissionId: { type: 'string' },
              winningNumber: { type: 'number' },
              date: { type: 'string' },
              prizeAmount: { type: 'number' },
              canClaim: { type: 'boolean' },
              claimDeadline: { type: 'string', format: 'date-time' },
            },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<Array<{ submissionId: string; winningNumber: number; date: string; prizeAmount: number; canClaim: boolean; claimDeadline: string }> | void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    app.logger.info({ userId }, 'Fetching eligible prize claims');

    try {
      // Get all winning submissions for this user
      const winningSubmissions = await app.db.query.submissions.findMany({
        where: and(
          eq(schema.submissions.userId, userId),
          eq(schema.submissions.isWinner, true),
        ),
      });

      // Get all existing claims for this user
      const existingClaims = await app.db.query.prizeClaims.findMany({
        where: eq(schema.prizeClaims.userId, userId),
      });

      const claimedSubmissionIds = new Set(
        existingClaims
          .filter((claim) => claim.claimStatus !== 'expired')
          .map((claim) => String(claim.submissionId))
      );

      // Get daily numbers for winning submissions
      const dailyNumbers = await app.db.query.dailyNumbers.findMany();
      const numbersByDate = new Map<string, number>();
      for (const dn of dailyNumbers) {
        numbersByDate.set(String(dn.date), Number(dn.targetNumber));
      }

      const now = new Date();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

      const eligible = winningSubmissions
        .filter((submission) => !claimedSubmissionIds.has(String(submission.id)))
        .filter((submission) => {
          // Check if within 30 days
          const submissionTime = submission.createdAt.getTime();
          return now.getTime() - submissionTime < thirtyDaysInMs;
        })
        .map((submission) => {
          const claimDeadline = new Date(submission.createdAt.getTime() + thirtyDaysInMs);
          return {
            submissionId: String(submission.id),
            winningNumber: Number(submission.confirmedNumber),
            date: String(submission.submissionDate),
            prizeAmount: 25,
            canClaim: true,
            claimDeadline: claimDeadline.toISOString(),
          };
        });

      app.logger.info({ userId, eligibleCount: eligible.length }, 'Eligible prizes fetched');

      return eligible;
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to fetch eligible prizes');
      throw error;
    }
  });

  // POST /api/prize-claims - Create a new prize claim
  app.fastify.post('/api/prize-claims', {
    schema: {
      description: 'Claim a prize for a winning submission',
      tags: ['prizes'],
      body: {
        type: 'object',
        required: ['submissionId', 'paymentMethod', 'paymentInfo', 'confirmedAccuracy'],
        properties: {
          submissionId: { type: 'string' },
          paymentMethod: { type: 'string', enum: ['paypal', 'venmo', 'egift'] },
          paymentInfo: { type: 'string' },
          confirmedAccuracy: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            claimId: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        403: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { submissionId: string; paymentMethod: string; paymentInfo: string; confirmedAccuracy: boolean } }>,
    reply: FastifyReply
  ): Promise<{ success: boolean; claimId: string; expiresAt: string } | void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    const { submissionId, paymentMethod, paymentInfo, confirmedAccuracy } = request.body;

    app.logger.info({ userId, submissionId, paymentMethod }, 'Creating prize claim');

    try {
      // Check age verification
      const user = await app.db.query.user.findFirst({
        where: eq(authSchema.user.id, userId),
      });

      if (!user || !Boolean(user.ageVerified)) {
        app.logger.warn({ userId }, 'User not age verified');
        return reply.status(403).send({ error: 'Age verification required' });
      }

      // Verify confirmation
      if (!confirmedAccuracy) {
        app.logger.warn({ userId }, 'Accuracy not confirmed');
        return reply.status(400).send({ error: 'You must confirm the accuracy of your payment information' });
      }

      // Check submission exists and is a winner
      const submission = await app.db.query.submissions.findFirst({
        where: eq(schema.submissions.id, submissionId),
      });

      if (!submission) {
        app.logger.warn({ userId, submissionId }, 'Submission not found');
        return reply.status(403).send({ error: 'Submission not found' });
      }

      if (submission.userId !== userId) {
        app.logger.warn({ userId, submissionId, ownerUserId: submission.userId }, 'Submission does not belong to user');
        return reply.status(400).send({ error: 'Submission does not belong to you' });
      }

      if (!submission.isWinner) {
        app.logger.warn({ userId, submissionId }, 'Submission is not a winner');
        return reply.status(400).send({ error: 'Only winning submissions can be claimed' });
      }

      // Check if already claimed
      const existingClaim = await app.db.query.prizeClaims.findFirst({
        where: and(
          eq(schema.prizeClaims.submissionId, submissionId),
          eq(schema.prizeClaims.userId, userId),
        ),
      });

      if (existingClaim && existingClaim.claimStatus !== 'expired') {
        app.logger.warn({ userId, submissionId }, 'Prize already claimed');
        return reply.status(400).send({ error: 'Prize already claimed' });
      }

      // Check 30-day window
      const now = new Date();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const submissionTime = submission.createdAt.getTime();

      if (now.getTime() - submissionTime > thirtyDaysInMs) {
        app.logger.warn({ userId, submissionId }, 'Claim window expired');
        return reply.status(400).send({ error: 'Claim window expired (30 days)' });
      }

      // Create prize claim
      const expiresAt = new Date(now.getTime() + thirtyDaysInMs);

      const created = await app.db
        .insert(schema.prizeClaims)
        .values({
          userId,
          submissionId: submission.id,
          paymentMethod,
          paymentInfo,
          confirmedAccuracy,
          expiresAt,
        })
        .returning();

      const claim = created[0];

      app.logger.info({ userId, claimId: claim.id, paymentMethod }, 'Prize claim created');

      return {
        success: true,
        claimId: claim.id,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      app.logger.error({ err: error, userId, submissionId }, 'Failed to create prize claim');
      throw error;
    }
  });

  // GET /api/prize-claims/my-claims - Get user's prize claims
  app.fastify.get('/api/prize-claims/my-claims', {
    schema: {
      description: 'Get current user\'s prize claims',
      tags: ['prizes'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              claimId: { type: 'string' },
              submissionId: { type: 'string' },
              winningNumber: { type: 'number' },
              date: { type: 'string' },
              paymentMethod: { type: 'string' },
              paymentInfo: { type: 'string' },
              claimStatus: { type: 'string' },
              claimedAt: { type: 'string', format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time' },
              processedAt: { type: ['string', 'null'], format: 'date-time' },
            },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<Array<{ claimId: string; submissionId: string; winningNumber: number; date: string; paymentMethod: string; paymentInfo: string; claimStatus: string; claimedAt: string; expiresAt: string; processedAt: string | null }> | void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    app.logger.info({ userId }, 'Fetching user prize claims');

    try {
      // Get all claims for this user
      const claims = await app.db.query.prizeClaims.findMany({
        where: eq(schema.prizeClaims.userId, userId),
      });

      // Get submission details
      const submissions = await app.db.query.submissions.findMany();
      const submissionsMap = new Map(submissions.map((s) => [String(s.id), s]));

      const formatted = claims.map((claim) => {
        const submission = submissionsMap.get(String(claim.submissionId));
        return {
          claimId: String(claim.id),
          submissionId: String(claim.submissionId),
          winningNumber: Number(submission?.confirmedNumber ?? 0),
          date: String(submission?.submissionDate ?? ''),
          paymentMethod: String(claim.paymentMethod),
          paymentInfo: String(claim.paymentInfo),
          claimStatus: String(claim.claimStatus),
          claimedAt: claim.claimedAt.toISOString(),
          expiresAt: claim.expiresAt.toISOString(),
          processedAt: claim.processedAt ? claim.processedAt.toISOString() : null,
        };
      });

      app.logger.info({ userId, claimsCount: formatted.length }, 'User prize claims fetched');

      return formatted;
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to fetch user prize claims');
      throw error;
    }
  });
}
