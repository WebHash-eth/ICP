import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IcDeployment } from '../deployment/deployment.schema';

export type DomainRegistrationStatus =
  | 'PendingOrder' // The registration request has been submitted and is waiting to be picked up.
  | 'PendingChallengeResponse' // The certificate has been ordered.
  | 'PendingAcmeApproval' // The challenge has been completed.
  | 'Available' // The registration request has been successfully processed.
  | 'Failed'; // The registration request failed.

@Entity('ic_domains')
export class IcDomain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  deploymentId: number;

  @Column({ type: 'varchar', length: 255 })
  registrationId: string;

  @Column({ type: 'varchar', length: 255 })
  registrationStatus: DomainRegistrationStatus;

  @Column({ type: 'text', default: null })
  registrationErrorMessage: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  // relationship
  @ManyToOne(() => IcDeployment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deploymentId' })
  deployment?: IcDeployment;
}
