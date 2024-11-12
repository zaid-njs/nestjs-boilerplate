import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateMeDto } from './dto/update-me.dto';
import { IUser } from './entities/user.entity';
import { ROLE } from './enums/user.enum';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth()
  @Get('/get-me')
  async getMe(@GetUser() user: IUser) {
    const data = await this.usersService.getMe(user);
    return { data };
  }

  @Auth()
  @Patch('/update-me')
  async updateMe(@GetUser() user: IUser, @Body() updateMeDto: UpdateMeDto) {
    const data = await this.usersService.updateMe(user, updateMeDto);
    return { data };
  }

  @Auth(ROLE.ADMIN)
  @Delete('/delete/:id')
  async delete(@Param('id') id: string) {
    const data = await this.usersService.delete(id);
    return { data };
  }
}
