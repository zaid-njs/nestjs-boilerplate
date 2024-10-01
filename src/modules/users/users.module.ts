import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { Otp, OtpSchema } from './entities/otp.entity';
import { User, UserSchema } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
  ],
  controllers: [UsersController, AuthController],
  providers: [UsersService, AuthService, JwtStrategy],
  exports: [UsersService, JwtStrategy],
})
export class UsersModule {}
