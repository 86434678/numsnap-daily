import { createApplication, resend, createAuthMiddleware, APIError } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { registerNumSnapRoutes } from './routes/numsnap.js';
import { registerPrizeRoutes } from './routes/prizes.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerDebugRoutes } from './routes/debug.js';
import { eq } from 'drizzle-orm';

// Combine all schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Configure authentication with Better Auth
// Hook to check email verification on login and prevent auto-login after signup
const beforeAuthHook = createAuthMiddleware(async (ctx) => {
  // Check login - verify email is verified
  if (ctx.path === "/sign-in/email") {
    const body = ctx.body as { email?: string; password?: string } | undefined;
    const email = body?.email;
    if (email) {
      // Query the database to check if email is verified
      try {
        const userData = await app.db.query.user.findFirst({
          where: eq(authSchema.user.email, email),
        });

        if (userData && !userData.emailVerified) {
          throw new APIError("FORBIDDEN", {
            message: "Please verify your email first (check spam/junk folder)",
          });
        }
      } catch (error) {
        if (error instanceof APIError) throw error;
        // Continue on database errors
        app.logger.warn({ email }, 'Error checking email verification status');
      }
    }
  }

  // Prevent auto-login after signup - don't return a session
  if (ctx.path === "/sign-up/email") {
    // Just let signup complete, don't auto-login
    return;
  }
});

// Hook to send verification email after signup
const afterAuthHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/sign-up/email" && ctx.context?.newSession?.user) {
    const newUser = ctx.context.newSession.user;
    app.logger.info({ userId: newUser.id, email: newUser.email }, 'New user signed up, sending verification email');

    // Send verification email - get the verification URL from Better Auth
    // Better Auth provides verification URL in context
    if (ctx.context?.verificationUrl) {
      resend.emails.send({
        from: 'NumSnap Daily <noreply@numsnap.com>',
        to: newUser.email,
        subject: 'Verify your email address',
        html: `<p>Welcome to NumSnap Daily!</p><p>Click the link below to verify your email address:</p><p><a href="${ctx.context.verificationUrl}">${ctx.context.verificationUrl}</a></p><p><strong>Check your spam/junk folder if you don't see the email</strong></p>`,
      });
    }
  }
});

app.withAuth({
  emailAndPassword: {
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      resend.emails.send({
        from: 'NumSnap Daily <noreply@numsnap.com>',
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      resend.emails.send({
        from: 'NumSnap Daily <noreply@numsnap.com>',
        to: user.email,
        subject: 'Verify your email address',
        html: `<p>Welcome to NumSnap Daily!</p><p>Click the link below to verify your email address:</p><p><a href="${url}">${url}</a></p><p><strong>Check your spam/junk folder if you don't see the email</strong></p>`,
      });
    },
  },
  hooks: {
    before: beforeAuthHook,
    after: afterAuthHook,
  },
});

app.withStorage();

// Register custom routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerNumSnapRoutes(app);
registerPrizeRoutes(app);
registerAdminRoutes(app);
registerAuthRoutes(app);
registerDebugRoutes(app);

await app.run();
app.logger.info('NumSnap Daily API running');
