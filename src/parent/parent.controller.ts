import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ParentService } from './parent.service';

@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  // ─────────────────────────────
  // 👨‍👩‍👧 PARENT ROUTES
  // ─────────────────────────────

  @Post()
  async createParent(@Body() body: any) {
    if (!body.name || !body.email || !body.password) {
      throw new BadRequestException('name, email and password are required');
    }
    return this.parentService.createParent(body);
  }

  @Get()
  async getAllParents() {
    return this.parentService.getAllParents();
  }

  @Get(':id')
  async getParent(@Param('id') id: string) {
    return this.parentService.getParentById(id);
  }

  @Patch(':id')
  async updateParent(@Param('id') id: string, @Body() body: any) {
    return this.parentService.updateParent(id, body);
  }

  @Delete(':id')
  async deleteParent(@Param('id') id: string) {
    return this.parentService.deleteParent(id);
  }

  // ─────────────────────────────
  // 👶 CHILD ROUTES
  // ─────────────────────────────

  @Post(':parentId/kids')
  async addKid(@Param('parentId') parentId: string, @Body() body: any) {
    if (!body.name || !body.age || !body.level) {
      throw new BadRequestException('name, age and level are required');
    }
    return this.parentService.addKid(parentId, body);
  }

  @Patch(':parentId/kids/:kidId')
  async updateKid(@Param('parentId') parentId: string, @Param('kidId') kidId: string, @Body() body: any) {
    return this.parentService.updateKid(parentId, kidId, body);
  }

  @Delete(':parentId/kids/:kidId')
  async deleteKid(@Param('parentId') parentId: string, @Param('kidId') kidId: string) {
    return this.parentService.deleteKid(parentId, kidId);
  }

  // ✅ Generate child's QR code (uses Mongo _id)
  @Get(':parentId/kids/:kidId/qr')
  async generateChildQr(@Param('parentId') parentId: string, @Param('kidId') kidId: string) {
    return this.parentService.generateChildQr(parentId, kidId);
  }

  // ✅ Child scans QR → load their info using Mongo _id
  @Get('child/:childId')
  async getChildById(@Param('childId') childId: string) {
    return this.parentService.getChildById(childId);
  }

  // ─────────────────────────────
  // 🧩 QUIZ ROUTES
  // ─────────────────────────────

  @Post(':parentId/kids/:kidId/quizzes')
  async addQuiz(@Param('parentId') parentId: string, @Param('kidId') kidId: string, @Body() quizData: any) {
    return this.parentService.addQuiz(parentId, kidId, quizData);
  }

  @Get(':parentId/kids/:kidId/quizzes')
  async getAllQuizzes(@Param('parentId') parentId: string, @Param('kidId') kidId: string) {
    return this.parentService.getAllQuizzes(parentId, kidId);
  }

  @Get(':parentId/kids/:kidId/quizzes/:quizId')
  async getQuizById(@Param('parentId') parentId: string, @Param('kidId') kidId: string, @Param('quizId') quizId: string) {
    return this.parentService.getQuizById(parentId, kidId, quizId);
  }

  @Patch(':parentId/kids/:kidId/quizzes/:quizId')
  async updateQuiz(@Param('parentId') parentId: string, @Param('kidId') kidId: string, @Param('quizId') quizId: string, @Body() body: any) {
    return this.parentService.updateQuiz(parentId, kidId, quizId, body);
  }

  @Delete(':parentId/kids/:kidId/quizzes/:quizId')
  async deleteQuiz(@Param('parentId') parentId: string, @Param('kidId') kidId: string, @Param('quizId') quizId: string) {
    return this.parentService.deleteQuiz(parentId, kidId, quizId);
  }

  // ─────────────────────────────
  // ❓ QUESTION ROUTES
  // ─────────────────────────────

  @Post(':parentId/kids/:kidId/quizzes/:quizId/questions')
  async addQuestion(@Param('parentId') parentId: string, @Param('kidId') kidId: string, @Param('quizId') quizId: string, @Body() body: any) {
    console.log('Incoming question:', body);
    return this.parentService.addQuestion(parentId, kidId, quizId, body);
  }

  @Patch(':parentId/kids/:kidId/quizzes/:quizId/questions/:questionId')
async updateQuestion(
  @Param('parentId') parentId: string,
  @Param('kidId') kidId: string,
  @Param('quizId') quizId: string,
  @Param('questionId') questionId: string,
  @Body() updateData: any,
) {
  console.log('Updating question with ID:', questionId);
  return this.parentService.updateQuestion(parentId, kidId, quizId, questionId, updateData);
}


  @Delete(':parentId/kids/:kidId/quizzes/:quizId/questions/:questionId')
async deleteQuestion(
  @Param('parentId') parentId: string,
  @Param('kidId') kidId: string,
  @Param('quizId') quizId: string,
  @Param('questionId') questionId: string,
) {
  return this.parentService.deleteQuestion(parentId, kidId, quizId, questionId);
}

}
