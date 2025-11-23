import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ParentService } from '../parent/parent.service';
import { Parent, ParentDocument } from '../parent/schemas/parent.schema';
import { randomBytes } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly parentService: ParentService,
    private readonly jwtService: JwtService,

    @InjectModel(Parent.name)
    private readonly parentModel: Model<ParentDocument>,

    private readonly mailService: MailService,
  ) {}

  async signup({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) {
    const existing = await this.parentService.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);

    const parent = await this.parentService.createParent({
      name,
      email,
      password: hashedPassword,
    });

    return this.login(parent);
  }

  async validateParent(
    email: string,
    password: string,
  ): Promise<ParentDocument> {
    const parent = await this.parentService.findByEmail(email);
    if (!parent) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, parent.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return parent;
  }

  async login(parent: ParentDocument) {
    const payload = {
      sub: parent._id.toString(),
      email: parent.email,
      name: parent.name,
    };

    const token = await this.jwtService.signAsync(payload);

    const { password, ...safeParent } = parent.toObject();
    return {
      access_token: token,
      parent: safeParent,
    };
  }

  // ───────────────────────────────────
  // 🔐 FORGOT PASSWORD (MOBILE)
  // ───────────────────────────────────
  async forgotPassword(email: string) {
    const parent = await this.parentModel.findOne({ email });
    if (!parent) throw new NotFoundException('Email not found');

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    parent.resetPasswordToken = token;
    parent.resetPasswordExpires = expiry;
    await parent.save();

    // DEEP LINK (opens mobile app)
    const resetLink = `${process.env.BACKEND_URL}/reset-password/${token}`;


    await this.mailService.sendMail(
  parent.email,
  'Reset your EduKid password',
  `
    <h1>Password Reset</h1>
    <p>Tap the button below to reset your password:</p>

    <a href="${resetLink}"
       style="display:inline-block;
              padding:12px 20px;
              background:#4CAF50;
              color:white;
              text-decoration:none;
              border-radius:6px;">
      Reset Password
    </a>

    <p>If the button doesn't work, use this link:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>This link expires in 15 minutes.</p>
  `,
);


    return { message: 'Reset email sent!' };
  }

  // ───────────────────────────────────
  // 🔐 RESET PASSWORD
  // ───────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const parent = await this.parentModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!parent) throw new BadRequestException('Invalid or expired token');

    parent.password = await bcrypt.hash(newPassword, 10);
    parent.resetPasswordToken = undefined;
    parent.resetPasswordExpires = undefined;

    await parent.save();

    return { message: 'Password updated successfully' };
  }
}
