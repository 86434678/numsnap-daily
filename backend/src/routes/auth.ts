import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { user } from '../db/schema/auth-schema.js';
import { eq } from 'drizzle-orm';

interface VerifyAgeBody {
  age: number;
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  ageVerified: boolean;
}

export function registerAuthRoutes(app: App) {
  const requireAuth = app.requireAuth();

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
            description: 'Invalid age or user must be 18+',
            type: 'object',
            properties: {
              error: { type: 'string' },
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
    ): Promise<{ success: boolean; ageVerified: boolean } | void> => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { age } = request.body;

      app.logger.info({ userId: session.user.id, age }, 'Verifying age');

      if (!Number.isInteger(age) || age < 0) {
        app.logger.warn({ userId: session.user.id, age }, 'Invalid age format');
        reply.code(400);
        return { success: false, ageVerified: false };
      }

      if (age < 18) {
        app.logger.warn({ userId: session.user.id, age }, 'User age under 18');
        reply.code(400);
        return { success: false, ageVerified: false };
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
      };
    }
  );
}
