import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Parent, ParentSchema } from './schemas/parent.schema';
import { Kid, KidSchema } from '../kid/schemas/kid.schema';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Parent.name, schema: ParentSchema },
      { name: Kid.name, schema: KidSchema },
    ]),
  ],
  controllers: [ParentController],
  providers: [ParentService],
  exports: [ParentService],
})
export class ParentModule {}
