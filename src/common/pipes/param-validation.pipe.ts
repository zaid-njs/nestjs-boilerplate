import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParamValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'param') {
      return value;
    }

    if ([undefined, null, 'undefined', 'null', ''].includes(value)) {
      throw new BadRequestException(`${metadata.data} parameter is required`);
    }

    return value;
  }
}
