import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('auth')
@Index(['walletAddress', 'nonce'], { unique: true })
export class AuthChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  walletAddress: string;

  @Column({ type: 'varchar', length: 255 })
  nonce: string;

  @Column({ type: 'varchar', length: 'MAX' }) // Changed from 'text' to 'varchar'
  message: string;

  @Column({ type: 'datetime2' }) // Changed to datetime2 for better precision
  expiresAt: Date;

  @Column({ type: 'datetime2', nullable: true }) // Changed to datetime2
  usedAt?: Date;

  @CreateDateColumn({ type: 'datetime2' }) // Changed to datetime2
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' }) // Changed to datetime2
  updatedAt: Date;
}
