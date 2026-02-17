import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel
      .findOne({ email: registerDto.email })
      .exec();

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = new this.userModel({
      ...registerDto,
      password: hashedPassword,
    });
    const savedUser = await user.save();

    return this.generateAuthResponse(savedUser);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: loginDto.email })
      .exec();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  private async generateAuthResponse(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}
