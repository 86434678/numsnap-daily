import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { user } from '../db/schema/auth-schema.js';

/**
 * Wrapper around app.requireAuth() that also checks if user.verified === true
 * Returns the session if authenticated and verified, or sends 403 if not verified
 */
export async function requireAuthAndVerified(
  app: App,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<{ user: { id: string; email: string; name: string } } | null> {
  const requireAuth = app.requireAuth();
  const session = await requireAuth(request, reply);
  if (!session) return null;

  const userId = session.user.id;

  try {
    const userData = await app.db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userData?.verified) {
      app.logger.warn({ userId }, 'User attempted to access protected endpoint without email verification');
      reply.status(403).send({
        error: 'Please verify your email first (check spam/junk folder)',
      });
      return null;
    }

    return session;
  } catch (error) {
    app.logger.error({ err: error, userId }, 'Failed to check user verification status');
    throw error;
  }
}
