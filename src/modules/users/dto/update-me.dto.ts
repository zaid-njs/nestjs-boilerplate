import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { STATUS } from '../enums/user.enum';

export class UpdateMeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photo: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  phoneNo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum([STATUS.ACTIVE, STATUS.USER_DEACTIVATED])
  status: STATUS;
}
