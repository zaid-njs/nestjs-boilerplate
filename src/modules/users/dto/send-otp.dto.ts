import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Email of user',
    default: 'test@yopmail.com',
  })
  @IsNotEmpty({ message: 'Please provide email' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  code: number;
}
