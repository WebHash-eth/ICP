import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1745846418267 implements MigrationInterface {
  name = 'Init1745846418267';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`ic_domains\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`deploymentId\` int NOT NULL, \`registrationId\` varchar(255) NOT NULL, \`registrationStatus\` varchar(255) NOT NULL, \`registrationErrorMessage\` text NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ic_deployments\` (\`id\` int NOT NULL, \`userId\` int NOT NULL, \`canisterId\` varchar(64) NOT NULL, \`canisterBlockId\` bigint NOT NULL, \`folderPath\` varchar(255) NOT NULL, \`status\` enum ('pending', 'in_progress', 'completed', 'deleted', 'failed') NOT NULL DEFAULT 'pending', \`error\` text NULL, \`deployedAt\` timestamp NULL, \`remainingCycles\` bigint NULL, \`lastStatusCheckAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ic_topups\` (\`id\` int NOT NULL AUTO_INCREMENT, \`deploymentId\` int NOT NULL, \`canisterId\` varchar(64) NOT NULL, \`amount\` bigint NOT NULL, \`cyclesBefore\` bigint NOT NULL, \`cyclesAfter\` bigint NULL, \`status\` enum ('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending', \`error\` text NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ic_domains\` ADD CONSTRAINT \`FK_3af8439a0c4bf18063ea7350018\` FOREIGN KEY (\`deploymentId\`) REFERENCES \`ic_deployments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`ic_domains\` DROP FOREIGN KEY \`FK_3af8439a0c4bf18063ea7350018\``,
    );
    await queryRunner.query(`DROP TABLE \`ic_topups\``);
    await queryRunner.query(`DROP TABLE \`ic_deployments\``);
    await queryRunner.query(`DROP TABLE \`ic_domains\``);
  }
}
