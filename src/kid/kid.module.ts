import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Kid, KidSchema } from './schemas/kid.schema';
import { KidService } from './kid.service';
import { KidController } from './kid.controller';
import { Parent, ParentSchema } from '../parent/schemas/parent.schema';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Kid.name, schema: KidSchema },
      { name: Parent.name, schema: ParentSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
  ],
  controllers: [KidController],
  providers: [KidService],
  exports: [KidService],
})
export class KidModule {}
