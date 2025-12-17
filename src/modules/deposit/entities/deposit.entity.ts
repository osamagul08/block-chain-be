import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';

export enum DepositStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_deposit_user')
  userId: string;

  @ManyToOne(() => Users, { onDelete: 'CASCADE' })
  user: Users;

  @Column({ type: 'varchar', length: 100 })
  @Index('IDX_deposit_solana_address')
  solanaAddress: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @Index('IDX_deposit_tx_signature', {
    unique: true,
    where: '"txSignature" IS NOT NULL',
  })
  txSignature?: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amountUsd: string;

  @Column({ type: 'numeric', precision: 18, scale: 6 })
  amountUsdc: string;

  @Column({
    type: 'enum',
    enum: DepositStatus,
    default: DepositStatus.PENDING,
  })
  status: DepositStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;
}
