export interface EnvConfig {
  [key: string]: string;

  //BASIC CREDENTIALS
  PORT?: string;
  APP_NAME?: string;
  APP_VERSION?: string;
  WEB_HOSTED_URL?: string;
  API_HOSTED_URL?: string;

  // JWT CREDENTIALS
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;

  // DATABASE CREDENTIALS
  MONGODB_URI?: string;
  MONGODB_PASSWORD?: string;

  // SENDGRID CREDENTIALS
  EMAIL_FROM?: string;
  SENDGRID_USERNAME?: string;
  SENDGRID_PASSWORD?: string;

  // SWAGGER CREDENTIALS
  SWAGGER_USERNAME?: string;
  SWAGGER_PASSWORD?: string;
}
