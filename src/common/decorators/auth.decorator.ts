import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ROLE } from '../../modules/users/enums/user.enum';
import { RolesGuard } from '../guards/role.guard';
import { Roles } from './set-roles.decorator';

export function Auth(...roles: ROLE[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(AuthGuard('jwt'), RolesGuard),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
