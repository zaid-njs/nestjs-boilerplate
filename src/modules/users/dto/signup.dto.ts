import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ROLE } from 'src/modules/users/enums/user.enum';

export class SignupDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'please provide name.' })
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'please provide name.' })
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'please provide email.' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'please provide password.' })
  @MinLength(8, { message: 'Min 8 characters are required.' })
  @MaxLength(30, { message: 'Max 30 characters are required.' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'please provide confirm password.' })
  @MinLength(8, { message: 'Min 8 characters are required.' })
  @MaxLength(30, { message: 'Max 30 characters are required.' })
  passwordConfirm: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  fcmToken: string[];

  role: ROLE;
}
