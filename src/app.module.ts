import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ParentModule } from './parent/parent.module';
import { KidModule } from './kid/kid.module';
import { QuizModule } from './quiz/quiz.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ Safely handle possible undefined env var
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost/kidquiz', {
      dbName: 'edukid',
    }),

    ParentModule,
    KidModule,
    QuizModule,
    AuthModule,
  ],
})
export class AppModule {}
