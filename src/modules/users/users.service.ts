import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateMeDto } from './dto/update-me.dto';
import { IUser, User } from './entities/user.entity';
import { ROLE, STATUS } from './enums/user.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly Users: Model<IUser>) {}

  async getMe(user: IUser): Promise<IUser> {
    if (user.status !== STATUS.ACTIVE)
      throw new UnauthorizedException('User is not active');

    return user;
  }

  async updateMe(user: IUser, updateMeDto: UpdateMeDto): Promise<IUser> {
    if (
      user.role === ROLE.ADMIN &&
      updateMeDto.status === STATUS.USER_DEACTIVATED
    )
      throw new BadRequestException('Not allowed to deactivate admin profile');

    const updatedUser = await this.Users.findOneAndUpdate(
      { _id: user._id },
      updateMeDto,
      { new: true },
    );

    return updatedUser;
  }

  async delete(id: string): Promise<IUser> {
    const user = await this.Users.findByIdAndUpdate(id, {
      isDeleted: true,
      status: STATUS.SYSTEM_DEACTIVATED,
    });
    if (!user) throw new NotFoundException('Users not found');
    return user;
  }

  //----------------- HELPER FUNCTIONS ----------------//

  /**
   * Retrieves the count of documents in the users collection that match the given filter.
   *
   * @param {object} filter A MongoDB filter object.
   * @returns {Promise<number>} A promise that resolves to the count of documents that match the filter.
   */
  async countHelper(filter: object): Promise<number> {
    return this.Users.countDocuments(filter);
  }

  /**
   * Retrieves a user with the role of ADMIN.
   *
   * @returns {Promise<IUser>} A promise that resolves to the user with the ADMIN role, or null if not found.
   */
  async getAdminHelper(): Promise<IUser> {
    return await this.Users.findOne({ role: ROLE.ADMIN });
  }

  /**
   * Retrieves a user from the database that matches the given filter.
   *
   * @param {object} filter A MongoDB filter object.
   * @returns {Promise<IUser>} A promise that resolves to the user if found, or null if not found.
   */
  async findOneHelper(filter: object): Promise<IUser> {
    return await this.Users.findOne(filter);
  }

  async updateOneHelper(
    filter: object,
    update: object,
    opt?: object,
  ): Promise<IUser> {
    return await this.Users.findOneAndUpdate(filter, update, {
      new: true,
      ...opt,
    });
  }
}
