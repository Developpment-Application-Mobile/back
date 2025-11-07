import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { ParentService } from './parent.service';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Delete } from '@nestjs/common/decorators/http/request-mapping.decorator';
import { Patch } from '@nestjs/common/decorators/http/request-mapping.decorator';

// Simple DTOs (you can move them to separate files)
class CreateParentDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

class LoginDto {
  email: string;
  password: string;
}

class CreateKidDto {
  name: string;
  age: number;
  interests?: string[];
  avatarUrl?: string;
}

@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Post('register')
  async register(@Body() body: CreateParentDto) {
    if (!body.name || !body.email || !body.password)
      throw new BadRequestException('Missing fields');

    const parent = await this.parentService.createParent(body);
    // ✅ safely remove password
    const { password, ...p } = parent.toObject();
    return p;
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const parent = await this.parentService.findByEmail(body.email);
    if (!parent) throw new BadRequestException('Invalid credentials');

    const match = await bcrypt.compare(body.password, (parent as any).password);
    if (!match) throw new BadRequestException('Invalid credentials');

    // ✅ safely remove password
    const { password, ...p } = parent.toObject();
    // NOTE: real app should return JWT; here we return parent object for simplicity
    return p;
  }

  @Post(':parentId/kids')
  async addKid(@Param('parentId') parentId: string, @Body() body: CreateKidDto) {
    if (!Types.ObjectId.isValid(parentId))
      throw new BadRequestException('Invalid parent id');
    const kid = await this.parentService.addKid(parentId, body as any);
    return kid;
  }

  @Get(':parentId/kids')
  async getKids(@Param('parentId') parentId: string) {
    if (!Types.ObjectId.isValid(parentId))
      throw new BadRequestException('Invalid parent id');
    return this.parentService.listKids(parentId);
  }

  @Get(':parentId')
  async getParent(@Param('parentId') parentId: string) {
    if (!Types.ObjectId.isValid(parentId))
      throw new BadRequestException('Invalid parent id');
    return this.parentService.findById(parentId);
  }

  @Patch(':parentId')
async updateParent(
  @Param('parentId') parentId: string,
  @Body() body: Partial<{ name: string; email: string; password: string; phone?: string }>
) {
  if (!Types.ObjectId.isValid(parentId))
    throw new BadRequestException('Invalid parent id');

  const updated = await this.parentService.update(parentId, body);
  if (!updated) throw new BadRequestException('Parent not found');
  return { message: 'Parent updated successfully', updated };
}


  @Delete(':parentId')
async deleteParent(@Param('parentId') parentId: string) {
  if (!Types.ObjectId.isValid(parentId))
    throw new BadRequestException('Invalid parent id');

  const deleted = await this.parentService.remove(parentId);
  if (!deleted) throw new BadRequestException('Parent not found');
  return { message: 'Parent deleted successfully' };
}
}
