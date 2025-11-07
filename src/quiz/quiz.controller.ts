import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { Types } from 'mongoose';

class CreateQuizDto {
  kidId?: string;
  title?: string;
  topics?: string[];
  difficulty?: string;
}

class CreateByQrDto {
  qrToken: string;
}

class UpdateQuizDto {
  title?: string;
  topics?: string[];
  difficulty?: string;
  status?: string; // e.g., active, completed
}

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ✅ Create a quiz for a specific kid (by ID)
  @Post('create')
  async create(@Body() body: CreateQuizDto) {
    if (!body.kidId) throw new BadRequestException('kidId required');
    return this.quizService.createQuizForKid(body.kidId, {
      title: body.title,
      topics: body.topics,
      difficulty: body.difficulty,
    });
  }

  // ✅ Create a quiz by QR token (used when kid scans a QR)
  @Post('create-by-qr')
  async createByQr(@Body() body: CreateByQrDto) {
    if (!body.qrToken) throw new BadRequestException('qrToken required');
    return this.quizService.createQuizByQrToken(body.qrToken);
  }

  // ✅ Get quiz by its ID
  @Get(':quizId')
  async get(@Param('quizId') quizId: string) {
    if (!Types.ObjectId.isValid(quizId)) throw new BadRequestException('Invalid quiz id');
    return this.quizService.getQuiz(quizId);
  }

  // ✅ Update quiz (optional)
  @Patch(':quizId')
  async update(@Param('quizId') quizId: string, @Body() body: UpdateQuizDto) {
    if (!Types.ObjectId.isValid(quizId)) throw new BadRequestException('Invalid quiz id');
    const updated = await this.quizService.updateQuiz(quizId, body);
    if (!updated) throw new BadRequestException('Quiz not found');
    return { message: 'Quiz updated successfully', updated };
  }

  // ✅ Delete quiz
  @Delete(':quizId')
  async delete(@Param('quizId') quizId: string) {
    if (!Types.ObjectId.isValid(quizId)) throw new BadRequestException('Invalid quiz id');
    const deleted = await this.quizService.deleteQuiz(quizId);
    if (!deleted) throw new BadRequestException('Quiz not found');
    return { message: 'Quiz deleted successfully' };
  }

  // ✅ Get all quizzes (optional, for testing or admin dashboard)
  @Get()
  async getAll() {
    return this.quizService.getAllQuizzes();
  }
}
