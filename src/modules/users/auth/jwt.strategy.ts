import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from 'jsonwebtoken';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from 'src/config/config.service';
import { IUser, User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name)
    private readonly Users: Model<IUser>,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<IUser> {
    const { id, iat } = payload;

    // fetching the user info.
    const user: IUser = await this.Users.findById(id);

    // 1) Check if user still exists
    if (!user)
      throw new UnauthorizedException(
        'The user belonging to this token does no longer exist.',
      );

    // 2) Check if user changed password after the token was issued
    if (user.changedPasswordAfter(iat))
      throw new UnauthorizedException(
        'User recently changed password! Please log in again.',
      );

    return user;
  }
}
