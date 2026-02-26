import { createApplication, resend } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { registerNumSnapRoutes } from './routes/numsnap.js';
import { registerPrizeRoutes } from './routes/prizes.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';

const schema = { ...appSchema, ...authSchema };

export const app = await createApplication(schema);
export type App = typeof app;

app.withAuth({
  emailAndPassword: {
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      resend.emails.send({
        from: 'NumSnap Daily <noreply@numsnap.com>',
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click the link to reset your password: <a href="${url}">${url}</a></p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const verifyUrl = `numsnapdaily://verify?token=${url.split('token=')[1]}`;
      resend.emails.send({
        from: 'NumSnap Daily <noreply@numsnap.com>',
        to: user.email,
        subject: 'Verify your email address',
        html: `<p>Click the link to verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p><p><strong>Check your email for verification link (check spam/junk folder if not in inbox)</strong></p>`,
      });
    },
  },
});
app.withStorage();

registerNumSnapRoutes(app);
registerPrizeRoutes(app);
registerAdminRoutes(app);
registerAuthRoutes(app);

await app.run();
app.logger.info('NumSnap Daily API running');
