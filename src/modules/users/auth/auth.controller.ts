import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ROLE } from 'src/modules/users/enums/user.enum';
import { Auth } from 'src/common/decorators/auth.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { LoginDto } from '../dto/login.dto';
import { SignupDto } from '../dto/signup.dto';
import { IUser } from '../entities/user.entity';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup') // signup for a user
  async signup(@Body() createUserDto: SignupDto) {
    const data = await this.authService.signup(createUserDto);

    return { status: 'success', data };
  }

  @Post('/login') //login for a user
  async login(@Body() loginUserDto: LoginDto) {
    const data = await this.authService.login(loginUserDto);

    return { status: 'success', data };
  }

  @Auth(ROLE.USER, ROLE.USER)
  @Post('/logout') // For logout user & admin
  async logout(@Body('fcmToken') fcmToken: string, @GetUser() user: IUser) {
    await this.authService.logout(fcmToken, user.id);

    return {
      status: 'success',
      message: 'logout success',
    };
  }
}
