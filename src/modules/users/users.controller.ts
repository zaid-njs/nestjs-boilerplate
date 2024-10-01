import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ROLE } from 'src/modules/users/enums/user.enum';
import { Auth } from 'src/common/decorators/auth.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { IUser } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth(ROLE.USER, ROLE.ADMIN)
  @Get('/me')
  async getMe(@GetUser() user: IUser) {
    return user;
  }
}
