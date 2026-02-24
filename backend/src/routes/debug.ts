import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/schema/auth-schema.js';
import type { App } from '../index.js';

/**
 * Debug routes for troubleshooting authentication and system status.
 * These should only be available in development mode.
 */
export function registerDebugRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/debug/auth-check - Check if authentication is working
  app.fastify.get('/api/debug/auth-check', {
    schema: {
      description: 'Check authentication status (debug only)',
      tags: ['debug'],
      response: {
        200: {
          type: 'object',
          properties: {
            authenticated: { type: 'boolean' },
            userId: { type: 'string' },
            userEmail: { type: 'string' },
            isAdmin: { type: 'boolean' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<{ authenticated: boolean; userId: string; userEmail: string; isAdmin: boolean } | void> => {
    const session = await requireAuth(request, reply);
    if (!session) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    try {
      const user = await app.db.query.user.findFirst({
        where: eq(authSchema.user.id, session.user.id),
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found in database' });
      }

      app.logger.info({ userId: user.id, email: user.email }, 'Auth check successful');

      return {
        authenticated: true,
        userId: user.id,
        userEmail: user.email,
        isAdmin: Boolean(user.isAdmin),
      };
    } catch (error) {
      app.logger.error({ err: error }, 'Auth check failed');
      throw error;
    }
  });

  // GET /api/debug/user-list - List all users (debug only, shows basic info)
  app.fastify.get('/api/debug/user-list', {
    schema: {
      description: 'List all users (debug only)',
      tags: ['debug'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              isAdmin: { type: 'boolean' },
              ageVerified: { type: 'boolean' },
              emailVerified: { type: 'boolean' },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<Array<{ id: string; email: string; name: string; isAdmin: boolean; ageVerified: boolean; emailVerified: boolean }>> => {
    try {
      const users = await app.db.query.user.findMany();

      const userList = users.map((user) => ({
        id: String(user.id),
        email: String(user.email),
        name: String(user.name),
        isAdmin: Boolean(user.isAdmin),
        ageVerified: Boolean(user.ageVerified),
        emailVerified: Boolean(user.emailVerified),
      }));

      app.logger.info({ count: userList.length }, 'User list retrieved');
      return userList;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to list users');
      throw error;
    }
  });

  // PATCH /api/debug/set-admin - Set a user as admin (debug only)
  app.fastify.patch<{ Body: { email: string } }>('/api/debug/set-admin', {
    schema: {
      description: 'Set a user as admin (debug only)',
      tags: ['debug'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            userId: { type: 'string' },
            email: { type: 'string' },
            isAdmin: { type: 'boolean' },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply): Promise<{ success: boolean; userId: string; email: string; isAdmin: boolean } | void> => {
    const { email } = request.body;

    app.logger.info({ email }, 'Attempting to set admin status');

    try {
      const user = await app.db.query.user.findFirst({
        where: eq(authSchema.user.email, email),
      });

      if (!user) {
        app.logger.warn({ email }, 'User not found for admin update');
        return reply.status(404).send({ error: 'User not found' });
      }

      await app.db
        .update(authSchema.user)
        .set({ isAdmin: true })
        .where(eq(authSchema.user.id, user.id));

      app.logger.info({ userId: user.id, email }, 'User promoted to admin');

      return {
        success: true,
        userId: String(user.id),
        email: String(user.email),
        isAdmin: true,
      };
    } catch (error) {
      app.logger.error({ err: error, email }, 'Failed to set admin status');
      throw error;
    }
  });
}
