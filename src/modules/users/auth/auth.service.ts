import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { sign } from 'jsonwebtoken';
import { Model } from 'mongoose';
import { generateOtpCode } from 'src/common/utils/helper.util';
import { ConfigService } from 'src/config/config.service';
import { EmailService } from 'src/shared/email.service';
import { ErrorLogService } from 'src/shared/error-log.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { IOtp, Otp } from '../entities/otp.entity';
import { IUser, User } from '../entities/user.entity';
import { ROLE, STATUS } from '../enums/user.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly Users: Model<IUser>,
    @InjectModel(Otp.name) private readonly Otps: Model<IOtp>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly logger: ErrorLogService,
  ) {}

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

  async login(loginUserDto: LoginDto): Promise<{ token: string; user: IUser }> {
    const { email, password } = loginUserDto;

    const user = await this.Users.findOne({
      email,
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password)))
      throw new UnauthorizedException('Invalid login credentials');

    if (user.status !== STATUS.ACTIVE)
      throw new UnauthorizedException('User is not active!');

    const token = this.signToken(user.id);

    user.password = undefined;

    return { token, user };
  }

  async adminLogin(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user: IUser = await this.Users.findOne({
      $or: [{ email }, { phoneNo: email }],
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password)))
      throw new UnauthorizedException('Invalid login credentials');

    if (ROLE.ADMIN !== user.role)
      throw new BadRequestException('Not a user route');

    return this.createSendToken(user);
  }

  async logout(id: string): Promise<void> {
    await this.Users.findByIdAndUpdate(id, {
      isOnline: false,
      lastLogin: Date.now(),
    }).lean();

    return;
  }

  async forgotPassword(createOtpDto: SendOtpDto) {
    const { email } = createOtpDto;

    const user: IUser = await this.Users.findOne({ email });
    if (!user) throw new BadRequestException('No user found');

    const existingOtp = await this.Otps.findOne({ email });
    if (existingOtp)
      throw new BadRequestException(
        'You must wait 2 minutes before making another request!',
      );

    createOtpDto.code = generateOtpCode();

    await this.Otps.create(createOtpDto);

    try {
      await this.emailService.sendForgotPassword(
        {
          email: user.email,
          firstName: user.firstName,
        },
        { code: createOtpDto.code },
      );
    } catch (error) {
      this.logger.logError(error.message, 'Forgot Password', error.stack);
      throw new BadRequestException('You have entered wrong Otp Code.');
    }

    return { message: 'Otp code has been send on your email' };
  }

  async verifyOtp(verifyOtpDto: SendOtpDto) {
    const { code, email } = verifyOtpDto;

    const otp: IOtp = await this.Otps.findOne({ email });

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

    const user: IUser = await this.Users.findOne({ email });
    if (!user) throw new BadRequestException('No user found');

    const existingOtp = await this.Otps.findOne({ email });
    if (existingOtp) {
      await this.Otps.findByIdAndUpdate(existingOtp._id, {
        code: generateOtpCode(),
      });
    } else {
      createOtpDto.code = generateOtpCode();
      await this.Otps.create(createOtpDto);
    }

    try {
      await this.emailService.sendOtpResend(
        {
          email: user.email,
          firstName: user.firstName,
        },
        { code: createOtpDto.code },
      );
    } catch (error) {
      this.logger.logError(error.message, 'Resend Otps', error.stack);
      throw new BadRequestException('Failed to send email');
    }

    return { message: 'Otps code has been send to your email' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { code, email, password } = resetPasswordDto;

    const user: IUser = await this.Users.findOne({ email }).select('+password');
    if (!user) throw new BadRequestException('No user found');

    await this.verifyOtp({ code, email });

    user.password = password;

    await user.save();

    return { message: 'Password reset successfully' };
  }

  async changePassword(user: IUser, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, password, passwordConfirm } = changePasswordDto;

    if (passwordConfirm !== password)
      throw new BadRequestException('Confirm password does not match');

    if (currentPassword === password)
      throw new BadRequestException(
        'New password cannot be same as current password',
      );

    const userCheck: IUser = await this.Users.findOne({
      _id: user?._id,
    }).select('+password');

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
