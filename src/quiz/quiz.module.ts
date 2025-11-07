import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from './schemas/quiz.schema';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { Kid, KidSchema } from '../kid/schemas/kid.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: Kid.name, schema: KidSchema },
    ]),
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
