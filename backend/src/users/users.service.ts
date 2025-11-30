import { BadRequestException, Injectable } from '@nestjs/common';
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
      select: [
        'id',
        'email',
        'name',
        'bio',
        'avatar',
        'subscriptionPrice',
        'isCreator',
        'isActive',
      ],
    });

    // Add mock data for photoCount
    // In a real app, you'd join with photos table
    return creators.map((creator) => ({
      id: creator.id,
      email: creator.email,
      name: creator.name || creator.email.split('@')[0],
      bio: creator.bio,
      avatar: creator.avatar,
      photoCount: Math.floor(Math.random() * 50) + 10, // Mock data
      subscriptionPrice: creator.subscriptionPrice || 9.99,
      isActive: creator.isActive,
    }));
  }

  async updateProfile(
    userId: number,
    updateData: Partial<User>,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only allow updating specific fields
    const allowedFields = ['name', 'bio', 'avatar', 'profileImage'];
    const filteredData: Partial<User> = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    await this.usersRepository.update(userId, filteredData);
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(userId, { password: hashedNewPassword });

    return { message: 'Password updated successfully' };
  }

  async becomeCreator(
    userId: number,
    subscriptionPrice: number,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isCreator) {
      throw new BadRequestException('User is already a creator');
    }

    await this.usersRepository.update(userId, {
      isCreator: true,
      subscriptionPrice,
    });

    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async getCreatorProfile(creatorId: number): Promise<any> {
    const creator = await this.usersRepository.findOne({
      where: { id: creatorId, isCreator: true, isActive: true },
      select: [
        'id',
        'email',
        'name',
        'bio',
        'avatar',
        'profileImage',
        'subscriptionPrice',
        'createdAt',
      ],
    });

    if (!creator) {
      throw new BadRequestException('Creator not found');
    }

    return {
      ...creator,
      name: creator.name || creator.email.split('@')[0],
      photoCount: Math.floor(Math.random() * 50) + 10, // Mock data
      subscriberCount: Math.floor(Math.random() * 1000) + 50, // Mock data
    };
  }
}
