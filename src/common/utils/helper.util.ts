import { HttpStatus } from '@nestjs/common';

const normalWord = (word?: string): string =>
  word.replace(/([A-Z]+)/g, ' $1').replace(/([A-Z][a-z])/g, '$1');

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const messages = Object.keys(err.keyValue).map(
    (key) =>
      `Duplicate field ${
        normalWord(key) || 'value'
      }: ${value}. Please use another ${normalWord(key) || 'value'}`,
  );
  return messages;
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map(
    (el: any) => `Invalid input: ${el?.message}`,
  );

  return errors;
};

const handleCastErrorDB = (err: any) => [`Invalid ${err.path}: ${err.value}.`];

export const HttpErrorHandlingFn = (
  err: any,
): {
  error: { status: string; message: { error: string[] } };
  httpStatusCode: number;
} => {
  console.log(err);

  let error: any = {};
  let httpStatusCode: number = 400;

  if ('BadRequestException' == err.name) {
    error = { status: 'fail', message: { error: [err.message] } };
    httpStatusCode = HttpStatus.BAD_REQUEST;
  } else if ('NotFoundException' == err.name) {
    error = { status: 'fail', message: { error: [err.message] } };
    httpStatusCode = HttpStatus.NOT_FOUND;
  } else if (err.statusCode == 401) {
    error = { status: 'fail', message: { error: [err.message] } };
    httpStatusCode = HttpStatus.UNAUTHORIZED;
  } else if (err.statusCode == 402) {
    error = { status: 'fail', message: { error: [err.message] } };
    httpStatusCode = HttpStatus.PAYMENT_REQUIRED;
  } else {
    error = {
      status: 'fail',
      message: {
        error: Array.isArray(err?.message) ? err.message : [err.message],
      },
    };
    httpStatusCode = err.status || HttpStatus.BAD_REQUEST;
  }

  return { error, httpStatusCode };
};

export const MongoErrorHandlingFn = (
  err: any,
): {
  error: { status: string; message: { error: string[] } };
  httpStatusCode: number;
} => {
  let error: any = {};
  let httpStatusCode: number = 400;

  if (err.code === 11000) {
    error = {
      status: 'fail',
      message: { error: handleDuplicateFieldsDB(err) },
    };
    httpStatusCode = HttpStatus.CONFLICT;
  } else if (err.name === 'ValidationError') {
    error = {
      status: 'fail',
      message: { error: handleValidationErrorDB(err) },
    };
    httpStatusCode = HttpStatus.BAD_REQUEST;
  } else if ('CastError' == err.name) {
    error = { status: 'fail', message: { error: handleCastErrorDB(err) } };
    httpStatusCode = HttpStatus.NOT_FOUND;
  } else {
    error = {
      status: 'fail',
      message: {
        error: Array.isArray(err?.message) ? err.message : [err.message],
      },
    };
    httpStatusCode = err.status || HttpStatus.BAD_REQUEST;
  }

  return { error, httpStatusCode };
};

export const matchRoles = (roles: string[], userRole: string) => {
  return roles.includes(userRole);
};
