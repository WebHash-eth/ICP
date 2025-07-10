import { z } from 'zod';

export const ConfigValidationSchema = z.object({
  NODE_ENV: z.enum(['local', 'dev', 'production']),
  PORT: z.coerce.number(),

  MYSQL_HOST: z.string(),
  MYSQL_PORT: z.coerce.number(),
  MYSQL_USERNAME: z.string(),
  MYSQL_PASSWORD: z.string(),
  MYSQL_DATABASE: z.string(),

  IC_IDENTITY_PEM: z.string(),
  IC_HOST: z.enum(['ic', 'local']),
  IC_HOST_URL: z.string().url().optional(),
  IC_FRONTEND_WASM_PATH: z.string().refine(
    (path) => {
      // eslint-disable-next-line
      const fs: typeof import('fs') = require('fs');
      try {
        fs.accessSync(path);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Frontend WASM file path must exist' },
  ),
  // IC_CYCLES_LEDGER_CANISTER_ID: z.string(),

  CRON_ENABLED: z.enum(['true', 'false']).optional(),
  DISCORD_ERROR_WEBHOOK_URL: z.string().url(),

  IC_MIN_CYCLES_THRESHOLD: z.coerce.bigint(),
  IC_CANISTER_STATUS_CHECK_INTERVAL_DAYS: z.coerce.number(),
  IC_TOP_UP_AMOUNT: z.coerce.bigint(),
  IC_INITIAL_CANISTER_CYCLES: z.coerce.bigint(),
});
