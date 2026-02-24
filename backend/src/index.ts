import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { registerNumSnapRoutes } from './routes/numsnap.js';
import { registerPrizeRoutes } from './routes/prizes.js';
import { registerAdminRoutes } from './routes/admin.js';

const schema = { ...appSchema, ...authSchema };

export const app = await createApplication(schema);
export type App = typeof app;

app.withAuth();
app.withStorage();

registerNumSnapRoutes(app);
registerPrizeRoutes(app);
registerAdminRoutes(app);

await app.run();
app.logger.info('NumSnap Daily API running');
