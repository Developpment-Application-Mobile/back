import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ParentModule } from './parent/parent.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost/kidquiz', {
      dbName: 'edukid',
    }),

    ParentModule,
    AuthModule,
  ],
})
export class AppModule {}
