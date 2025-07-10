import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { IcDomain } from '../domain/domain.schema';

export enum DeploymentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELETED = 'deleted',
  FAILED = 'failed',
}

@Entity('ic_deployments')
export class IcDeployment {
  @Column({ type: 'int', primary: true })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 64 })
  canisterId: string;

  @Column({ type: 'bigint' })
  canisterBlockId: string;

  @Column({ type: 'varchar', length: 255 })
  folderPath: string;

  @Column({
    type: 'enum',
    enum: DeploymentStatus,
    default: DeploymentStatus.PENDING,
  })
  status: DeploymentStatus;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  // @Column({ type: 'json', nullable: true })
  // metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  deployedAt: Date | null;

  @Column({ type: 'bigint', nullable: true })
  remainingCycles: string | null;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP', // Works for both PostgreSQL and MySQL databases
  })
  lastStatusCheckAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // relationships
  // let lazy false as we don't want to load domains until explicitly requested
  @OneToMany(() => IcDomain, (domain) => domain.deployment, {
    cascade: true,
  })
  domains?: IcDomain[];
}
