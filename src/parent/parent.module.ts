import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Parent, ParentSchema } from './schemas/parent.schema';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([{ name: Parent.name, schema: ParentSchema }]),
  ],
  controllers: [ParentController],
  providers: [ParentService],
  exports:[ ParentService,
  MongooseModule,],
})
export class ParentModule {}
