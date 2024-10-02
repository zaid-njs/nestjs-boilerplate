import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { sign } from 'jsonwebtoken';
import { Model } from 'mongoose';
import { generateOtpCode } from 'src/common/utils/helper.util';
import { ConfigService } from 'src/config/config.service';
import { EmailService } from 'src/config/email.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { SignupDto } from '../dto/signup.dto';
import { IOtp, Otp } from '../entities/otp.entity';
import { IUser, User } from '../entities/user.entity';
import { ROLE } from '../enums/user.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly User: Model<IUser>,
    @InjectModel(Otp.name) private readonly Otp: Model<IOtp>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  addFCMToken = (token: string[]) => {
    let obj = {};
    if (!!token) obj = { $addToSet: { fcmTokens: token } };
    return obj;
  };

  removeFCMToken = (token: string) => {
    let obj = {};
    if (!!token) obj = { $pull: { fcmTokens: token } };
    return obj;
  };

  addPushNotificationIds_onLogin = async (email: string, token: string[]) => {
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

    try {
      await this.emailService.sendEmailVerification(
        {
          email: newUser.email,
          firstName: newUser.firstName,
        },
        {},
      );
    } catch (error) {
      await newUser.deleteOne();
      throw new BadRequestException(
        'Failed to send an OTP. Please contact support if the problem persists!',
      );
    }

    return this.createSendToken(newUser);
  }

  async login(loginUserDto: LoginDto): Promise<{ token: string; user: IUser }> {
    const { email, password, fcmToken } = loginUserDto;

    const user = await this.User.findOne({
      email,
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password)))
      throw new UnauthorizedException('Invalid login credentials');

    if (ROLE.USER !== user.role)
      throw new BadRequestException('Not an admin route');

    if (fcmToken) await this.addPushNotificationIds_onLogin(email, fcmToken);

    const token = this.signToken(user.id);

    user.password = undefined;

    return { token, user };
  }

  async adminLogin(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user: IUser = await this.User.findOne({
      $or: [{ email }, { phoneNo: email }],
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password)))
      throw new UnauthorizedException('Invalid login credentials');

    if (ROLE.ADMIN !== user.role)
      throw new BadRequestException('Not a user route');

    return this.createSendToken(user);
  }

  async logout(fcmToken: string, id: string): Promise<void> {
    await this.User.findByIdAndUpdate(id, {
      lastLogin: Date.now(),
      ...this.removeFCMToken(fcmToken),
    }).lean();

    return;
  }

  async forgotPassword(createOtpDto: SendOtpDto) {
    const { email } = createOtpDto;

    const user: IUser = await this.User.findOne({ email });
    if (!user) throw new BadRequestException('No user found');

    const existingOtp = await this.Otp.findOne({ email });
    if (existingOtp)
      throw new BadRequestException(
        'You must wait 2 minutes before making another request!',
      );

    createOtpDto.code = generateOtpCode();

    await this.Otp.create(createOtpDto);

    try {
      await this.emailService.sendForgotPassword(
        {
          email: user.email,
          firstName: user.firstName,
        },
        { code: createOtpDto.code },
      );
    } catch (error) {
      throw new BadRequestException('You have entered wrong Otp Code.');
    }

    return { message: 'Otp code has been send on your email' };
  }

  async verifyOtp(verifyOtpDto: SendOtpDto) {
    const { code, email } = verifyOtpDto;

    const otp: IOtp = await this.Otp.findOne({ email });

    if (!otp) {
      throw new BadRequestException(
        'OTP Code has been expired. Please generate again.',
      );
    }

    if (code !== otp?.code)
      throw new BadRequestException('You have entered wrong Otp Code.');

    return { message: 'OTP verified successfully' };
  }

  async resendOtp(createOtpDto: SendOtpDto) {
    const { email } = createOtpDto;

    const user: IUser = await this.User.findOne({ email });
    if (!user) throw new BadRequestException('No user found');

    const existingOtp = await this.Otp.findOne({ email });
    if (existingOtp)
      throw new BadRequestException(
        'You must wait 2 minutes before making another request!',
      );

    createOtpDto.code = generateOtpCode();

    await this.Otp.create(createOtpDto);

    try {
      await this.emailService.sendOtpResend(
        {
          email: user.email,
          firstName: user.firstName,
        },
        { code: createOtpDto.code },
      );
    } catch (error) {
      throw new BadRequestException('Failed to send email');
    }

    return { message: 'Otp code has been send to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { code, email, password } = resetPasswordDto;

    const user: IUser = await this.User.findOne({ email }).select('+password');
    if (!user) throw new BadRequestException('No user found');

    await this.verifyOtp({ code, email });

    user.password = password;

    await user.save();

    return { message: 'Password reset successfully' };
  }

  async changePassword(user: IUser, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, password, passwordConfirm } = changePasswordDto;

    if (currentPassword == password)
      throw new BadRequestException(
        'New password cannot be same as current password',
      );

    const userCheck: IUser = await this.User.findOne({ _id: user?._id }).select(
      '+password',
    );

    const passwordCheck = await user.correctPassword(
      currentPassword,
      userCheck.password,
    );
    if (!passwordCheck) throw new BadRequestException('Wrong current password');

    userCheck.password = password;

    await userCheck.save();

    return this.createSendToken(userCheck);
  }
}
