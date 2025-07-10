import { ConfigValidationSchema } from './config.validation';

export const APP_NAME = 'webhash-ic';

const config = (config: Record<string, unknown>) => {
  const ENVS = ConfigValidationSchema.parse(config);
  const PORT = ENVS.PORT;

  return {
    app: {
      name: APP_NAME,
      env: ENVS.NODE_ENV,
      port: PORT,
    },

    db: {
      mysql: {
        host: ENVS.MYSQL_HOST,
        port: ENVS.MYSQL_PORT,
        username: ENVS.MYSQL_USERNAME,
        password: ENVS.MYSQL_PASSWORD,
        database: ENVS.MYSQL_DATABASE,
      },
    },

    ic: {
      hostName: ENVS.IC_HOST,
      host:
        ENVS.IC_HOST === 'ic'
          ? 'https://ic0.app'
          : ENVS.IC_HOST_URL
            ? ENVS.IC_HOST_URL
            : 'http://localhost:8080',
      identityPem: ENVS.IC_IDENTITY_PEM,
      frontendWasmPath: ENVS.IC_FRONTEND_WASM_PATH,
      // cycles ledger canister id
      clcId: 'um5iw-rqaaa-aaaaq-qaaba-cai',

      initialCanisterCycles: ENVS.IC_INITIAL_CANISTER_CYCLES,
      minCyclesThreshold: ENVS.IC_MIN_CYCLES_THRESHOLD,
      canisterStatusCheckIntervalDays:
        ENVS.IC_CANISTER_STATUS_CHECK_INTERVAL_DAYS,
      topUpAmount: ENVS.IC_TOP_UP_AMOUNT,
    },

    discord: {
      errorWebhookUrl: ENVS.DISCORD_ERROR_WEBHOOK_URL,
    },

    cron: {
      enabled: ENVS.CRON_ENABLED === 'true',
    },
  } as const;
};

export type ConfigVariablesType = ReturnType<typeof config>;

export default config;
