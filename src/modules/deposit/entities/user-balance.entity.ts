import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';

@Entity('user_balances')
export class UserBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  @Index('IDX_user_balance_user')
  userId: string;

  @OneToOne(() => Users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Users;

  @Column({ type: 'varchar', length: 100 })
  @Index('IDX_user_balance_solana_address')
  solanaAddress: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  webhookId?: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  balanceUsd: string;

  @Column({ type: 'numeric', precision: 18, scale: 6, default: 0 })
  balanceUsdc: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastUpdated: Date;
}
