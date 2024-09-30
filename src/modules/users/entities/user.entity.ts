import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { compare, hash } from 'bcryptjs';
import { HydratedDocument } from 'mongoose';
import { ROLE, STATUS } from 'src/common/constants/user.enum';
import validator from 'validator';

@Schema({ timestamps: true })
class User {
  @Prop({ type: String })
  firstName: string;

  @Prop({ type: String })
  lastName: string;

  @Prop({
    type: String,
    unique: true,
    index: true,
    required: true,
    validate: validator.isEmail,
  })
  email: string;

  @Prop({ type: String, select: false, required: true })
  password: string;

  @Prop({ type: String, enum: ROLE, default: ROLE.USER })
  role: ROLE;

  @Prop({ type: String, enum: STATUS, default: STATUS.ACTIVE })
  status: STATUS;

  @Prop({ type: Boolean, default: false })
  isOnline: boolean;

  @Prop({ type: [String], default: [] })
  fcmTokens: string[];

  @Prop({ type: [String], default: [] })
  socketIds: string[];

  @Prop({ type: Date, default: new Date() })
  lastSeen: Date;

  @Prop({ type: Number })
  passwordChangedAt: number;

  @Prop({ type: Boolean, default: true })
  inAppNotifications: boolean;

  @Prop({ type: Boolean, default: true })
  pushNotifications: boolean;

  changedPasswordAfter = function (JWTTimestamp: number) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        new Date(this.passwordChangedAt).getTime() / 1000 + '',
        10,
      );

      return JWTTimestamp < changedTimestamp;
    }

    return false;
  };

  correctPassword = async function (
    candidatePassword: string,
    userPassword: string,
  ) {
    return await compare(candidatePassword, userPassword);
  };
}

const UserSchema = SchemaFactory.createForClass(User);
type IUser = HydratedDocument<User>;

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await hash(this.password, 12);

  if (this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

UserSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
) {
  return await compare(candidatePassword, userPassword);
};

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      new Date(this.passwordChangedAt).getTime() / 1000 + '',
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

export { IUser, User, UserSchema };
