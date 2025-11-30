import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './user/user';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createUser(
    email: string,
    password: string,
    isCreator = false,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      isCreator,
    });
    return this.usersRepository.save(user);
  }

  async getCreators(): Promise<any[]> {
    const creators = await this.usersRepository.find({
      where: { isCreator: true, isActive: true },
      select: ['id', 'email', 'isCreator', 'isActive'],
    });

    // Add mock data for photoCount and subscriptionPrice
    // In a real app, you'd join with photos and subscription tables
    return creators.map(creator => ({
      id: creator.id,
      email: creator.email,
      photoCount: Math.floor(Math.random() * 50) + 10, // Mock data
      subscriptionPrice: parseFloat((Math.random() * 20 + 5).toFixed(2)), // Mock price between $5-25
      isActive: creator.isActive,
    }));
  }
}
