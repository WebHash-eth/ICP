import { DataSource } from 'typeorm';
import { IcDeployment } from './src/core/deployment/deployment.schema';
import { IcDomain } from './src/core/domain/domain.schema';
import { IcTopUp } from './src/core/topup/topup.schema';
import { config } from 'dotenv-flow';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  synchronize: false,
  entities: [IcDeployment, IcDomain, IcTopUp],
  migrations: ['src/migration/**/*.ts'],
});
