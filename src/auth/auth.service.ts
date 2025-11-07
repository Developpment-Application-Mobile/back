import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ParentService } from '../parent/parent.service';
import { ParentDocument } from '../parent/schemas/parent.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly parentService: ParentService,
    private readonly jwtService: JwtService,
  ) {}

  async validateParent(email: string, password: string): Promise<ParentDocument> {
    const parent = await this.parentService.findByEmail(email);
    if (!parent) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, parent.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return parent;
  }

  async login(parent: ParentDocument) {
    const payload = {
      sub: parent._id.toString(),
      email: parent.email,
      name: parent.name,
    };
    const token = await this.jwtService.signAsync(payload);

    // ✅ Safely remove the password using destructuring
    const { password, ...safeParent } = parent.toObject();

    return {
      access_token: token,
      parent: safeParent,
    };
  }
}
