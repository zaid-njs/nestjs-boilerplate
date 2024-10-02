import { IsOptional, IsString } from 'class-validator';

export class SeenNotificationDto {
  // ==================== OPTIONAL FIELDS ==========================
  @IsOptional()
  @IsString()
  notificationId: string;
}
