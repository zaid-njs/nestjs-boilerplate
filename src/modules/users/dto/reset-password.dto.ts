import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  // ==================== REQUIRED FIELDS ==========================

  @ApiProperty({
    description: 'Email of user',
    default: 'test@yopmail.com',
  })
  @IsNotEmpty({ message: 'Please provide email' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'otp code of user',
    default: '123456',
  })
  @IsNotEmpty({ message: 'Please provide otp code ' })
  @IsNumber()
  code: number;

  @ApiProperty({
    description: 'new password of user',
    default: '123456789',
  })
  @IsNotEmpty({ message: 'Please provide password' })
  @MinLength(8)
  @IsString()
  password: string;

  @ApiProperty({
    description: 'confirm password of user',
    default: '123456789',
  })
  @IsNotEmpty({ message: 'Please provide confirm password' })
  @MinLength(8)
  @IsString()
  passwordConfirm: string;
}
