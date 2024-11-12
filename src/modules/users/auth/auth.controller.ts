import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { IUser } from '../entities/user.entity';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() loginUserDto: LoginDto) {
    const data = await this.authService.login(loginUserDto);

    return { data };
  }

  @Post('/admin-login')
  async adminLogin(@Body() loginUserDto: LoginDto) {
    const data = await this.authService.adminLogin(loginUserDto);

    return { data };
  }

  @Auth()
  @Post('/logout')
  async logout(@GetUser() user: IUser) {
    await this.authService.logout(user.id);

    return {
      message: 'logout success',
    };
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() createOtpDto: SendOtpDto) {
    const data = await this.authService.forgotPassword(createOtpDto);

    return { data };
  }

  @Patch('/verify-otp')
  async verifyOtp(@Body() verifyOtpDto: SendOtpDto) {
    const data = await this.authService.verifyOtp(verifyOtpDto);

    return { data };
  }

  @Patch('/resend-otp')
  async resendOtp(@Body() createOtpDto: SendOtpDto) {
    const data = await this.authService.resendOtp(createOtpDto);

    return { data: { user: data } };
  }

  @Patch('/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(resetPasswordDto);

    return { data };
  }

  @Auth()
  @Patch('/change-password')
  async changePassword(
    @GetUser() user: IUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const data = await this.authService.changePassword(user, changePasswordDto);

    return { data };
  }
}
