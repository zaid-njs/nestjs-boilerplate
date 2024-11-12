import { BadRequestException } from '@nestjs/common';
import { FileFilterCallback } from 'multer';

const allowedVideoTypes = [
  'video/mp4',
  'video/mov',
  'video/avi',
  'video/mkv',
  'video/wmv',
];
const allowedDocumentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

export const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  const { fieldname } = file;

  let isValid = false;

  if (fieldname === 'images') {
    isValid = true;
  } else if (fieldname === 'videos') {
    isValid = allowedVideoTypes.includes(file.mimetype);
  } else if (fieldname === 'documents') {
    isValid = allowedDocumentTypes.includes(file.mimetype);
  }

  if (isValid) {
    callback(null, true);
  } else {
    callback(new BadRequestException(`Invalid file type: ${file.mimetype}`));
  }
};
