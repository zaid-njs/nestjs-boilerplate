import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { ConfigService } from 'src/config/config.service';
import { Readable, Stream } from 'stream';
import { ErrorLogService } from './error-log.service';

@Injectable()
export class S3Service {
  private s3: S3Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: ErrorLogService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  private async convertImage(
    file: Express.Multer.File,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const allowedFormats = ['jpeg', 'png', 'gif'];
    let image = sharp(file.buffer);
    const metadata = await image.metadata();

    let mimeType = file.mimetype;

    // Convert to an allowed format if not already in one
    if (!allowedFormats.includes(metadata.format)) {
      image = image.toFormat('png'); // default conversion
      mimeType = 'image/png';
    } else {
      mimeType = `image/${metadata.format}`;
    }

    const buffer = await image.toBuffer();

    return { buffer, mimeType };
  }

  async uploadImages(
    files: Express.Multer.File[],
  ): Promise<{ key: string; size: number; mimeType: string }[]> {
    const results = await Promise.all(
      files.map(async (file) => {
        const converted = await this.convertImage(file);
        const buffer = converted.buffer;
        const mimeType = converted.mimeType;

        const key = `${randomUUID()}.${mimeType.split('/')[1]}`;
        const command = new PutObjectCommand({
          Bucket: this.configService.get('AWS_BUCKET_NAME'),
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        });

        await this.s3.send(command);

        return { key, size: buffer.length, mimeType };
      }),
    );

    return results;
  }

  async uploadVideos(
    files: Express.Multer.File[],
  ): Promise<{ key: string; size: number; mimeType: string }[]> {
    const allowedFormats = [
      'video/mp4',
      'video/mov',
      'video/avi',
      'video/mkv',
      'video/wmv',
    ];

    const results = await Promise.all(
      files.map(async (file) => {
        if (!allowedFormats.includes(file.mimetype)) {
          throw new BadRequestException(`Invalid video format. `);
        }

        const buffer = file.buffer;
        const mimeType = file.mimetype;
        const key = `${randomUUID()}.${file.originalname.substring(file.originalname.lastIndexOf('.') + 1)}`;

        const command = new PutObjectCommand({
          Bucket: this.configService.get('AWS_BUCKET_NAME'),
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        });

        await this.s3.send(command);

        return { key, size: buffer.length, mimeType };
      }),
    );

    return results;
  }

  async uploadDocuments(
    files: Express.Multer.File[],
  ): Promise<{ key: string; size: number; mimeType: string }[]> {
    const allowedFormats = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ];

    const results = await Promise.all(
      files.map(async (file) => {
        if (!allowedFormats.includes(file.mimetype)) {
          throw new BadRequestException(`Invalid document format.`);
        }

        const buffer = file.buffer;
        const mimeType = file.mimetype;
        const key = `${randomUUID()}.${file.originalname.substring(file.originalname.lastIndexOf('.') + 1)}`;

        const command = new PutObjectCommand({
          Bucket: this.configService.get('AWS_BUCKET_NAME'),
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        });

        await this.s3.send(command);

        return { key, size: buffer.length, mimeType };
      }),
    );

    return results;
  }

  async getFile(key: string): Promise<Stream> {
    const command = new GetObjectCommand({
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
      Key: key,
    });

    const { Body } = await this.s3.send(command);

    // Return the stream for the file
    if (!(Body instanceof Readable)) {
      throw new BadRequestException(
        'File not found or could not be retrieved.',
      );
    }

    return Body;
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
      Key: key,
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      this.logger.logError(error.message, 'Delete File', error.stack);
    }
  }

  async generateSignedUrl(
    mimeType: string,
  ): Promise<{ key: string; url: string }> {
    const key = `${randomUUID()}.${mimeType.split('/')[1]}`;
    const command = new PutObjectCommand({
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
      Key: key,
      ContentType: mimeType,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
    return { key, url };
  }
}
