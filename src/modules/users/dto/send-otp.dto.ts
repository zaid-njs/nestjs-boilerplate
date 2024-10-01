import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendOtpDto {
  // ==================== REQUIRED FIELDS ==========================
  @ApiProperty({
    description: 'Email of user',
    default: 'test@yopmail.com',
  })
  @IsNotEmpty({ message: 'Please provide email' })
  @IsEmail()
  email: string;

  // ==================== SERVER SIDE FIELDS ==========================

  code: number;
}
