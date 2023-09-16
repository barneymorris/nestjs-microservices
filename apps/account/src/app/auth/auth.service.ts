import { Injectable } from '@nestjs/common';
import { LoginDTO, RegisterDTO } from './auth.controller';
import { UserRepository } from '../user/repositories/user.repository';
import { UserEntity } from '../user/entities/user.entity';
import { UserRole } from '@nesjs-microservices/interfaces';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async register({ email, displayName, password }: RegisterDTO) {
    const oldUser = await this.userRepository.findUser(email);

    if (oldUser) {
      throw new Error('This user already registered');
    }

    const newUserEntity = await new UserEntity({
      displayName,
      email,
      role: UserRole.Student,
      passwordHash: '',
    }).setPassword(password);

    const newUser = await this.userRepository.createUser(newUserEntity);

    return {
      email: newUser.email,
      displayName: newUser.displayName,
      id: newUser._id,
    };
  }

  async validateUser({ email, password }: LoginDTO) {
    const user = await this.userRepository.findUser(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const userEntity = new UserEntity(user);

    const isPasswordCorrect = await userEntity.validatePassword(password);

    if (!isPasswordCorrect) {
      throw new Error('Invalid credentials');
    }

    return {
      id: userEntity._id,
    };
  }

  async login(id: string) {
    return {
      access_token: await this.jwtService.signAsync({ id }),
    };
  }
}
