import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { sign } from 'jsonwebtoken';
import { Model } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { IUser, User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly User: Model<IUser>,
    private readonly configService: ConfigService,
  ) {}
  //Helper Functions for auth
  addFCMToken = (token) => {
    let obj = {};
    if (!!token) obj = { $addToSet: { fcmTokens: token } };
    return obj;
  };

  removeFCMToken = (token) => {
    let obj = {};
    if (!!token) obj = { $pull: { fcmTokens: token } };
    return obj;
  };

  addPushNotificationIds_onLogin = async (email, token) => {
    if (token && email)
      await this.User.findOneAndUpdate(
        { email },
        { $addToSet: { fcmTokens: token } },
      );
  };

  signToken(id: string) {
    return sign({ id }, this.configService.get('JWT_SECRET'), {
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });
  }

  createSendToken(user: IUser) {
    const token = this.signToken(user.id);

    user.password = undefined;

    return { token, user };
  }

  async signup(
    createUserDto: SignupDto,
  ): Promise<{ token: string; user: IUser }> {
    const { email, fcmToken } = createUserDto;

    const userExists = await this.User.findOne({
      email,
    }).lean();

    if (userExists)
      throw new ConflictException({ message: 'User already Exist.' });

    let newUser = await this.User.create({
      ...createUserDto,
      ...this.addFCMToken(fcmToken),
    });

    return this.createSendToken(newUser);
  }

  async login(loginUserDto: LoginDto): Promise<any> {
    const { email, password, fcmToken } = loginUserDto;

    // check if account doesn't exist
    const user = await this.User.findOne({
      email,
    }).select('+password +otp');

    if (!user || !(await user.correctPassword(password, user.password)))
      throw new UnauthorizedException('Incorrect email or password.');

    // 3) If everything ok, send token to client
    if (fcmToken) await this.addPushNotificationIds_onLogin(email, fcmToken);

    const token = this.signToken(user.id);

    // Remove password from output
    user.password = undefined;

    return { token, user };
  }

  async logout(fcmToken: string, id: string): Promise<any> {
    await this.User.findByIdAndUpdate(id, {
      lastLogin: Date.now(),
      ...this.removeFCMToken(fcmToken),
    }).lean();

    return;
  }
}
