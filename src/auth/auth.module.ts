import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ParentModule } from '../parent/parent.module';
import { JwtStrategy } from './jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { Parent, ParentSchema } from '../parent/schemas/parent.schema';
import { MailModule } from '../mail/mail.module';



@Module({
  imports: [
     forwardRef(() => ParentModule),
    PassportModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey',
      signOptions: { expiresIn: '7d' },
    }),
    MongooseModule.forFeature([{ name: Parent.name, schema: ParentSchema }]), // 👈 Add this
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

