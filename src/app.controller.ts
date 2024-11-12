import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AppService } from './app.service';
import { fileFilter } from './common/utils/file-filter.util';
import { S3Service } from './shared/s3.service';

@ApiTags('Main')
@Controller({ path: '/', version: '1' })
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly s3Service: S3Service,
  ) {}

  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('latest-commit')
  getLatestCommit(): string {
    return this.appService.getLatestCommit();
  }

  @Post('/upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'videos', maxCount: 5 },
        { name: 'documents', maxCount: 5 },
      ],
      {
        fileFilter: fileFilter,
        limits: { fileSize: 20_000_000 },
      },
    ),
  )
  async uploadFiles(
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
  ): Promise<{
    images: { key: string; size: number; mimeType: string }[];
    videos: { key: string; size: number; mimeType: string }[];
    documents: { key: string; size: number; mimeType: string }[];
  }> {
    const imageFiles = files?.images || [];
    const videoFiles = files?.videos || [];
    const documentFiles = files?.documents || [];

    const images = imageFiles.length
      ? await this.s3Service.uploadImages(imageFiles)
      : [];
    const videos = videoFiles.length
      ? await this.s3Service.uploadVideos(videoFiles)
      : [];
    const documents = documentFiles.length
      ? await this.s3Service.uploadDocuments(documentFiles)
      : [];

    return { images, videos, documents };
  }

  @Post('get-signed-url')
  async generateSignedUrl(@Body('mimeType') mimeType: string) {
    if (!mimeType) {
      throw new BadRequestException('"mimeType" must be provided in body');
    }

    const result = await this.s3Service.generateSignedUrl(mimeType);
    return result;
  }

  @Get('/file/:key')
  async getFile(
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<void> {
    const fileStream = await this.s3Service.getFile(key);

    fileStream.on('error', (_) => {
      res.status(400).send('File not found');
    });

    res.setHeader('Content-Disposition', `attachment; filename="${key}"`);
    fileStream.pipe(res);
  }
}
