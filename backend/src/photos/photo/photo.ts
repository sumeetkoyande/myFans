import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/user/user';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.id)
  creator: User;

  @Column({ default: false })
  isPremium: boolean;
}
