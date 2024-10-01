import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  // ==================== REQUIRED FIELDS ==========================

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

  @ApiProperty({
    description: 'old password of user',
    default: '12345678',
  })
  @IsNotEmpty({ message: 'Please provide old password' })
  @MinLength(8)
  @IsString()
  currentPassword: string;
}
