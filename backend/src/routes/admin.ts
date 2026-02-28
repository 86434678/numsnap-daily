import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import * as authSchema from '../db/schema/auth-schema.js';
import type { App } from '../index.js';

export function registerAdminRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * Helper function to check if user is admin
   */
  async function checkIsAdmin(userId: string): Promise<boolean> {
    const user = await app.db.query.user.findFirst({
      where: eq(authSchema.user.id, userId),
    });
    return Boolean(user?.isAdmin);
  }

  // GET /api/admin/check - Check if current user is admin
  app.fastify.get('/api/admin/check', {
    schema: {
      description: 'Check if current user is an admin',
      tags: ['admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            isAdmin: { type: 'boolean' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<{ isAdmin: boolean } | void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    app.logger.info({ userId }, 'Checking admin status');

    try {
      const isAdmin = await checkIsAdmin(userId);
      return { isAdmin };
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to check admin status');
      throw error;
    }
  });

  // GET /api/admin/winners - Get all winners with details
  app.fastify.get('/api/admin/winners', {
    schema: {
      description: 'Get all winners with detailed information (admin only)',
      tags: ['admin'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              winnerId: { type: 'string' },
              submissionId: { type: 'string' },
              userName: { type: 'string' },
              userEmail: { type: 'string' },
              photoUrl: { type: 'string' },
              submissionDate: { type: 'string', format: 'date-time' },
              snappedNumber: { type: 'number' },
              targetNumber: { type: 'number' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              locationSnippet: { type: 'string' },
              prizeClaimId: { type: ['string', 'null'] },
              paymentMethod: { type: ['string', 'null'] },
              paymentInfo: { type: ['string', 'null'] },
              paymentStatus: { type: 'string' },
              claimedAt: { type: ['string', 'null'], format: 'date-time' },
              expiresAt: { type: ['string', 'null'], format: 'date-time' },
            },
          },
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
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<Array<{
    winnerId: string;
    submissionId: string;
    userName: string;
    userEmail: string;
    photoUrl: string;
    submissionDate: string;
    snappedNumber: number;
    targetNumber: number;
    latitude: number;
    longitude: number;
    locationSnippet: string;
    prizeClaimId: string | null;
    paymentMethod: string | null;
    paymentInfo: string | null;
    paymentStatus: string;
    claimedAt: string | null;
    expiresAt: string | null;
  }> | void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    app.logger.info({ userId }, 'Fetching winners list');

    try {
      // Check if user is admin
      const isAdmin = await checkIsAdmin(userId);
      if (!isAdmin) {
        app.logger.warn({ userId }, 'Non-admin user attempted to access winners');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      // Get all winning submissions
      const winningSubmissions = await app.db.query.submissions.findMany({
        where: eq(schema.submissions.isWinner, true),
      });

      // Get all users
      const users = await app.db.query.user.findMany();
      const usersMap = new Map(users.map((u) => [u.id, u]));

      // Get all daily numbers
      const dailyNumbers = await app.db.query.dailyNumbers.findMany();
      const numbersByDate = new Map(dailyNumbers.map((d) => [String(d.date), Number(d.targetNumber)]));

      // Get all prize claims
      const prizeClaims = await app.db.query.prizeClaims.findMany();
      const claimsBySubmissionId = new Map(prizeClaims.map((c) => [String(c.submissionId), c]));

      // Build winner details
      const winners = winningSubmissions.map((submission) => {
        const user = usersMap.get(submission.userId);
        const targetNumber = numbersByDate.get(String(submission.submissionDate)) ?? 0;
        const claim = claimsBySubmissionId.get(String(submission.id));

        const latitude = submission.latitude ? Number(submission.latitude) : 0;
        const longitude = submission.longitude ? Number(submission.longitude) : 0;

        const createdAtDate = submission.createdAt instanceof Date ? submission.createdAt : new Date(String(submission.createdAt));
        const claimedAtDate = claim?.claimedAt instanceof Date ? claim.claimedAt : (claim?.claimedAt ? new Date(String(claim.claimedAt)) : null);
        const expiresAtDate = claim?.expiresAt instanceof Date ? claim.expiresAt : (claim?.expiresAt ? new Date(String(claim.expiresAt)) : null);

        return {
          winnerId: submission.userId,
          submissionId: String(submission.id),
          userName: String(user?.name ?? 'Unknown'),
          userEmail: String(user?.email ?? 'Unknown'),
          photoUrl: submission.photoUrl,
          submissionDate: createdAtDate.toISOString(),
          snappedNumber: Number(submission.confirmedNumber),
          targetNumber: Number(targetNumber),
          latitude,
          longitude,
          locationSnippet: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          prizeClaimId: claim ? String(claim.id) : null,
          paymentMethod: claim?.paymentMethod ? String(claim.paymentMethod) : null,
          paymentInfo: claim?.paymentInfo ? String(claim.paymentInfo) : null,
          paymentStatus: claim?.claimStatus === 'completed' ? 'Paid' : claim?.claimStatus === 'processing' ? 'Processing' : claim?.claimStatus === 'expired' ? 'Forfeited' : 'Pending',
          claimedAt: claimedAtDate ? claimedAtDate.toISOString() : null,
          expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
        };
      });

      app.logger.info({ count: winners.length }, 'Winners list retrieved');
      return winners;
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to fetch winners');
      throw error;
    }
  });

  // PATCH /api/admin/prize-claims/:claimId - Update prize claim status
  app.fastify.patch<{ Params: { claimId: string }; Body: { paymentStatus: string; notes?: string } }>('/api/admin/prize-claims/:claimId', {
    schema: {
      description: 'Update prize claim status (admin only)',
      tags: ['admin'],
      params: {
        type: 'object',
        required: ['claimId'],
        properties: {
          claimId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['paymentStatus'],
        properties: {
          paymentStatus: { type: 'string', enum: ['Pending', 'Processing', 'Paid', 'Forfeited'] },
          notes: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            claim: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                claimStatus: { type: 'string' },
                notes: { type: ['string', 'null'] },
              },
            },
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
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request, reply): Promise<{ success: boolean; claim: { id: string; claimStatus: string; notes: string | null } } | void> => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const userId = session.user.id;
    const { claimId } = request.params;
    const { paymentStatus, notes } = request.body;

    app.logger.info({ userId, claimId, paymentStatus }, 'Updating prize claim');

    try {
      // Check if user is admin
      const isAdmin = await checkIsAdmin(userId);
      if (!isAdmin) {
        app.logger.warn({ userId }, 'Non-admin user attempted to update claim');
        return reply.status(403).send({ error: 'Admin access required' });
      }

      // Get the claim
      const claim = await app.db.query.prizeClaims.findFirst({
        where: eq(schema.prizeClaims.id, claimId),
      });

      if (!claim) {
        app.logger.warn({ claimId }, 'Prize claim not found');
        return reply.status(404).send({ error: 'Prize claim not found' });
      }

      // Map user-friendly status to internal status
      const statusMap: Record<string, string> = {
        'Pending': 'pending',
        'Processing': 'processing',
        'Paid': 'completed',
        'Forfeited': 'expired',
      };

      const internalStatus = statusMap[paymentStatus];
      if (!internalStatus) {
        app.logger.warn({ paymentStatus }, 'Invalid payment status');
        return reply.status(400).send({ error: 'Invalid payment status' });
      }

      // Update the claim
      let processedAt = claim.processedAt;
      if (internalStatus === 'completed' && !claim.processedAt) {
        processedAt = new Date();
      }

      const updated = await app.db
        .update(schema.prizeClaims)
        .set({
          claimStatus: internalStatus,
          notes: notes || claim.notes,
          processedAt,
        })
        .where(eq(schema.prizeClaims.id, claimId))
        .returning();

      const updatedClaim = updated[0];

      // If marked as Paid, optionally send email notification (placeholder)
      if (internalStatus === 'completed') {
        app.logger.info({ claimId, userId: claim.userId }, 'Prize marked as paid - email notification queued');
        // TODO: Send email notification to winner
      }

      app.logger.info({ claimId, status: internalStatus }, 'Prize claim updated');

      return {
        success: true,
        claim: {
          id: String(updatedClaim.id),
          claimStatus: updatedClaim.claimStatus,
          notes: updatedClaim.notes,
        },
      };
    } catch (error) {
      app.logger.error({ err: error, userId, claimId }, 'Failed to update prize claim');
      throw error;
    }
  });
}
