import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true, length: 50 })
  username?: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  walletAddress: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeAddress() {
    if (this.walletAddress) {
      this.walletAddress = this.walletAddress.toLowerCase();
    }
  }
}
