import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  walletAddress: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeAddress() {
    if (this.walletAddress) {
      this.walletAddress = this.walletAddress.toLowerCase();
    }
  }
}
