import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { user, emailVerificationToken } from '../db/schema/auth-schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { resend } from '@specific-dev/framework';

interface VerifyAgeBody {
  age: number;
}

interface ResendVerificationBody {
  email: string;
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  ageVerified: boolean;
  emailVerified: boolean;
}

function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export function registerAuthRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/verify?token=xyz - Verifies email token
  app.fastify.get<{ Querystring: { token: string } }>(
    '/api/verify',
    {
      schema: {
        description: 'Verify email with token from verification email',
        tags: ['auth'],
        querystring: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string', description: 'Email verification token' },
          },
        },
        response: {
          200: {
            description: 'Email verified successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Invalid or expired token',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { token: string } }>,
      reply: FastifyReply
    ): Promise<{ success: boolean; message: string }> => {
      const { token } = request.query as { token: string };

      app.logger.info({ token: token.substring(0, 10) }, 'Verifying email token');

      const verificationRecord = await app.db.query.emailVerificationToken.findFirst({
        where: and(
          eq(emailVerificationToken.token, token),
          gt(emailVerificationToken.expiresAt, new Date())
        ),
      });

      if (!verificationRecord) {
        app.logger.warn({ token: token.substring(0, 10) }, 'Invalid or expired token');
        reply.code(400);
        return { success: false, message: 'Invalid or expired token' };
      }

      await app.db
        .update(user)
        .set({ emailVerified: true, verified: true })
        .where(eq(user.id, verificationRecord.userId));

      await app.db
        .delete(emailVerificationToken)
        .where(eq(emailVerificationToken.token, token));

      app.logger.info(
        { userId: verificationRecord.userId },
        'Email verified successfully'
      );

      return {
        success: true,
        message: 'Email verified! Please log in',
      };
    }
  );

  // POST /api/resend-verification - Resends verification email
  app.fastify.post<{ Body: ResendVerificationBody }>(
    '/api/resend-verification',
    {
      schema: {
        description: 'Resend email verification',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', description: 'User email' },
          },
        },
        response: {
          200: {
            description: 'Verification email sent',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          404: {
            description: 'User not found',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: ResendVerificationBody }>,
      reply: FastifyReply
    ): Promise<{ success: boolean; message: string }> => {
      const { email } = request.body;

      app.logger.info({ email }, 'Resending verification email');

      const userData = await app.db.query.user.findFirst({
        where: eq(user.email, email),
      });

      if (!userData) {
        app.logger.warn({ email }, 'User not found for verification resend');
        reply.code(404);
        return { success: false, message: 'User not found' };
      }

      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await app.db.insert(emailVerificationToken).values({
        token,
        userId: userData.id,
        expiresAt,
      });

      const verifyUrl = `numsnapdaily://verify?token=${token}`;
      resend.emails.send({
        from: 'NumSnap Daily <noreply@numsnap.com>',
        to: email,
        subject: 'Verify your email address',
        html: `<p>Click the link to verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p><p><strong>Check your email for verification link (check spam/junk folder if not in inbox)</strong></p>`,
      });

      app.logger.info({ email }, 'Verification email resent');

      return {
        success: true,
        message: 'Verification email sent',
      };
    }
  );

  // POST /api/verify-age - Age verification
  app.fastify.post<{ Body: VerifyAgeBody }>(
    '/api/verify-age',
    {
      schema: {
        description: 'Verify user age (18+)',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['age'],
          properties: {
            age: { type: 'number', description: 'User age' },
          },
        },
        response: {
          200: {
            description: 'Age verified successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              ageVerified: { type: 'boolean' },
            },
          },
          400: {
            description: 'User must be 18+',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: VerifyAgeBody }>,
      reply: FastifyReply
    ): Promise<{ success: boolean; ageVerified?: boolean; message?: string } | void> => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { age } = request.body;

      app.logger.info({ userId: session.user.id, age }, 'Verifying age');

      if (age < 18) {
        app.logger.warn({ userId: session.user.id, age }, 'User age under 18');
        reply.code(400);
        return {
          success: false,
          message: 'You must be 18 or older',
        };
      }

      await app.db
        .update(user)
        .set({
          ageVerified: true,
          age,
          ageVerifiedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));

      app.logger.info(
        { userId: session.user.id, age },
        'Age verified successfully'
      );

      return { success: true, ageVerified: true };
    }
  );

  // POST /api/debug/mark-verified - DEBUG endpoint to mark user as verified (test only)
  app.fastify.post<{ Body: { userId: string } }>(
    '/api/debug/mark-verified',
    {
      schema: {
        description: 'DEBUG: Mark user as verified (test environment only)',
        tags: ['debug'],
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'User marked as verified',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: { userId: string } }>,
      reply: FastifyReply
    ): Promise<{ success: boolean }> => {
      const { userId } = request.body;

      app.logger.info({ userId }, 'Debug: Marking user as verified');

      await app.db
        .update(user)
        .set({ verified: true })
        .where(eq(user.id, userId));

      return { success: true };
    }
  );

  // GET /api/me - Get current user profile
  app.fastify.get<{} & { Reply: MeResponse }>(
    '/api/me',
    {
      schema: {
        description: 'Get current user profile',
        tags: ['auth'],
        response: {
          200: {
            description: 'Current user profile',
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              ageVerified: { type: 'boolean' },
              emailVerified: { type: 'boolean' },
            },
          },
          401: {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<MeResponse | void> => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching user profile');

      const userData = await app.db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      });

      if (!userData) {
        app.logger.error({ userId: session.user.id }, 'User not found');
        reply.code(401);
        return;
      }

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        ageVerified: userData.ageVerified,
        emailVerified: userData.emailVerified,
      };
    }
  );
}
