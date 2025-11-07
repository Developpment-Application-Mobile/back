import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Parent } from './schemas/parent.schema';
import { Kid } from '../kid/schemas/kid.schema';

@Injectable()
export class ParentService {
  constructor(
    @InjectModel(Parent.name) private parentModel: Model<Parent>,
    @InjectModel(Kid.name) private kidModel: Model<Kid>,
  ) {}

  async createParent(data: { name: string; email: string; password: string; phone?: string }) {
  const exists = await this.parentModel.findOne({ email: data.email });
  if (exists) throw new ConflictException('Email already registered');

  const hashed = await bcrypt.hash(data.password, 10);
  const created = new this.parentModel({ ...data, password: hashed });
  return created.save();
}


  async findByEmail(email: string) {
    return this.parentModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid parent id');
    return this.parentModel.findById(id).populate('kids').exec();
  }

  async addKid(
    parentId: string,
    kidData: { name: string; age: number; interests?: string[]; avatarUrl?: string },
  ) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const kid = new this.kidModel({ ...kidData, parent: parent._id });
    await kid.save();

    // ✅ Explicit cast to fix TS error
    parent.kids.push(kid._id as unknown as Types.ObjectId);
    await parent.save();

    return kid;
  }

  async listKids(parentId: string) {
    const parent = await this.parentModel.findById(parentId).populate('kids').exec();
    if (!parent) throw new NotFoundException('Parent not found');
    return parent.kids;
  }

  async update(id: string, updateData: any) {
  // If password is being updated, hash it again
  if (updateData.password) {
    const salt = await bcrypt.genSalt();
    updateData.password = await bcrypt.hash(updateData.password, salt);
  }

  return this.parentModel.findByIdAndUpdate(id, updateData, {
    new: true, // return the updated doc
  });
}

  async remove(id: string) {
  return this.parentModel.findByIdAndDelete(id);
}
}
