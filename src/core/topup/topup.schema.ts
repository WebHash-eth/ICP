import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

export enum TopUpStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('ic_topups')
export class IcTopUp {
  @Column({ type: 'int', primary: true, generated: 'increment' })
  id: number;

  @Column({ type: 'int' })
  deploymentId: number;

  @Column({ type: 'varchar', length: 64 })
  canisterId: string;

  @Column({ type: 'bigint' })
  amount: string;

  @Column({ type: 'bigint' })
  cyclesBefore: string;

  @Column({ type: 'bigint', nullable: true })
  cyclesAfter: string;

  @Column({
    type: 'enum',
    enum: TopUpStatus,
    default: TopUpStatus.PENDING,
  })
  status: TopUpStatus;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
