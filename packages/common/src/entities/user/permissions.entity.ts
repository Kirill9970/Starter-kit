import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { ControllerType } from '../../utils';

@Unique(['messagePattern', 'method'])
@Entity('Permissions')
export class PermissionEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar', nullable: false })
  public method!: string;

  @Column({ type: 'varchar', nullable: true })
  public alias!: string;

  @Column({ type: 'varchar', nullable: false })
  public messagePattern!: string;

  @Column({ type: 'enum', enum: ControllerType, default: ControllerType.READ })
  public type!: ControllerType;

  @Column({ type: 'boolean', nullable: true })
  public isPublic!: boolean;

  @Column({ type: 'text', nullable: true })
  public description!: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  public createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  public updatedAt!: Date;
}
