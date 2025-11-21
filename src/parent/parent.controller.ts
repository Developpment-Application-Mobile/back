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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ParentService } from './parent.service';
import { CreateParentDto, UpdateParentDto } from './dto/parent.dto';
import { CreateChildDto, UpdateChildDto } from './dto/child.dto';
import { QuizDto, UpdateQuizDto, GenerateQuizDto, SubmitQuizAnswersDto } from './dto/quiz.dto';
import { QuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { AuthService } from 'src/auth/auth.service';

@ApiTags('parents')
@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService,
    private readonly authService: AuthService,
  ) { }

  // ─────────────────────────────
  // 👨‍👩‍👧 PARENT ROUTES
  // ─────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new parent' })
  @ApiBody({ type: CreateParentDto })
  @ApiResponse({ status: 201, description: 'Parent successfully created' })
  @ApiBadRequestResponse({
    description: 'Bad request - name, email and password are required',
  })
  async createParent(@Body() body: CreateParentDto) {
    if (!body.name || !body.email || !body.password) {
      throw new BadRequestException('name, email and password are required');
    }
    return this.parentService.createParent(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all parents' })
  @ApiResponse({ status: 200, description: 'List of all parents' })
  async getAllParents() {
    return this.parentService.getAllParents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a parent by ID' })
  @ApiParam({ name: 'id', description: 'Parent ID' })
  @ApiResponse({ status: 200, description: 'Parent found' })
  @ApiNotFoundResponse({ description: 'Parent not found' })
  async getParent(@Param('id') id: string) {
    return this.parentService.getParentById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a parent' })
  @ApiParam({ name: 'id', description: 'Parent ID' })
  @ApiBody({ type: UpdateParentDto })
  @ApiResponse({ status: 200, description: 'Parent successfully updated' })
  @ApiNotFoundResponse({ description: 'Parent not found' })
  async updateParent(@Param('id') id: string, @Body() body: UpdateParentDto) {
    return this.parentService.updateParent(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a parent' })
  @ApiParam({ name: 'id', description: 'Parent ID' })
  @ApiResponse({ status: 200, description: 'Parent successfully deleted' })
  @ApiNotFoundResponse({ description: 'Parent not found' })
  async deleteParent(@Param('id') id: string) {
    return this.parentService.deleteParent(id);
  }

  // ─────────────────────────────
  // 👶 CHILD ROUTES
  // ─────────────────────────────

  @Post(':parentId/kids')
  @ApiOperation({ summary: 'Add a child to a parent' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiBody({ type: CreateChildDto })
  @ApiResponse({ status: 201, description: 'Child successfully added' })
  @ApiBadRequestResponse({
    description: 'Bad request - name, age and level are required',
  })
  @ApiNotFoundResponse({ description: 'Parent not found' })
  async addKid(
    @Param('parentId') parentId: string,
    @Body() body: CreateChildDto,
  ) {
    if (!body.name || !body.age || !body.level) {
      throw new BadRequestException('name, age and level are required');
    }
    return this.parentService.addKid(parentId, body);
  }

  @Patch(':parentId/kids/:kidId')
  @ApiOperation({ summary: 'Update a child' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiBody({ type: UpdateChildDto })
  @ApiResponse({ status: 200, description: 'Child successfully updated' })
  @ApiNotFoundResponse({ description: 'Parent or child not found' })
  async updateKid(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Body() body: UpdateChildDto,
  ) {
    return this.parentService.updateKid(parentId, kidId, body);
  }

  @Delete(':parentId/kids/:kidId')
  @ApiOperation({ summary: 'Delete a child' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiResponse({ status: 200, description: 'Child successfully deleted' })
  @ApiNotFoundResponse({ description: 'Parent or child not found' })
  async deleteKid(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
  ) {
    return this.parentService.deleteKid(parentId, kidId);
  }

  // ✅ Generate child's QR code (uses Mongo _id)
  @Get(':parentId/kids/:kidId/qr')
  @ApiOperation({ summary: 'Generate QR code for a child' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
    schema: { type: 'object', properties: { qrCode: { type: 'string' } } },
  })
  @ApiNotFoundResponse({ description: 'Parent or child not found' })
  async generateChildQr(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
  ) {
    return this.parentService.generateChildQr(parentId, kidId);
  }

  // ✅ Child scans QR → load their info using Mongo _id
  @Get('child/:childId')
  @ApiOperation({ summary: 'Get a child by ID (for QR code scanning)' })
  @ApiParam({ name: 'childId', description: 'Child ID (Mongo _id)' })
  @ApiResponse({ status: 200, description: 'Child found' })
  @ApiNotFoundResponse({ description: 'Child not found' })
  async getChildById(@Param('childId') childId: string) {
    return this.parentService.getChildById(childId);
  }

  // ─────────────────────────────
  // 🧩 QUIZ ROUTES
  // ─────────────────────────────

  @Post(':parentId/kids/:kidId/quizzes')
  @ApiOperation({
    summary: 'Generate and add a quiz to a child',
    description: 'Generate a new quiz. If body is empty or missing required fields, generates a retry quiz based on incorrectly answered questions. Otherwise, generates a normal quiz based on provided parameters.'
  })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiBody({ type: GenerateQuizDto, required: false })
  @ApiResponse({
    status: 201,
    description: 'Quiz successfully generated and added',
  })
  @ApiNotFoundResponse({ description: 'Parent or child not found' })
  async addQuiz(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Body() quizRequest: GenerateQuizDto,
  ) {
    return this.parentService.addQuiz(parentId, kidId, quizRequest);
  }

  @Get(':parentId/kids/:kidId/quizzes')
  @ApiOperation({ summary: 'Get all quizzes for a child' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiResponse({ status: 200, description: 'List of quizzes' })
  @ApiNotFoundResponse({ description: 'Parent or child not found' })
  async getAllQuizzes(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
  ) {
    return this.parentService.getAllQuizzes(parentId, kidId);
  }

  @Get(':parentId/kids/:kidId/quizzes/:quizId')
  @ApiOperation({ summary: 'Get a quiz by ID' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz found' })
  @ApiNotFoundResponse({ description: 'Parent, child, or quiz not found' })
  async getQuizById(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Param('quizId') quizId: string,
  ) {
    return this.parentService.getQuizById(parentId, kidId, quizId);
  }

  @Patch(':parentId/kids/:kidId/quizzes/:quizId')
  @ApiOperation({ summary: 'Update a quiz' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiBody({ type: UpdateQuizDto })
  @ApiResponse({ status: 200, description: 'Quiz successfully updated' })
  @ApiNotFoundResponse({ description: 'Parent, child, or quiz not found' })
  async updateQuiz(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Param('quizId') quizId: string,
    @Body() body: UpdateQuizDto,
  ) {
    return this.parentService.updateQuiz(parentId, kidId, quizId, body);
  }

  @Post(':parentId/kids/:kidId/quizzes/:quizId/submit')
  @ApiOperation({ 
    summary: 'Submit quiz answers',
    description: 'Submit user answers for a quiz. This will update each question with the user\'s answer, calculate the score, and mark the quiz as answered.'
  })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiBody({ type: SubmitQuizAnswersDto })
  @ApiResponse({ status: 200, description: 'Quiz answers submitted successfully' })
  @ApiNotFoundResponse({ description: 'Parent, child, or quiz not found' })
  async submitQuizAnswers(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Param('quizId') quizId: string,
    @Body() body: SubmitQuizAnswersDto,
  ) {
    return this.parentService.submitQuizAnswers(parentId, kidId, quizId, body.answers);
  }

  @Delete(':parentId/kids/:kidId/quizzes/:quizId')
  @ApiOperation({ summary: 'Delete a quiz' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz successfully deleted' })
  @ApiNotFoundResponse({ description: 'Parent, child, or quiz not found' })
  async deleteQuiz(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Param('quizId') quizId: string,
  ) {
    return this.parentService.deleteQuiz(parentId, kidId, quizId);
  }

  // ─────────────────────────────
  // ❓ QUESTION ROUTES
  // ─────────────────────────────

  @Post(':parentId/kids/:kidId/quizzes/:quizId/questions')
  @ApiOperation({ summary: 'Add a question to a quiz' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiBody({ type: QuestionDto })
  @ApiResponse({ status: 201, description: 'Question successfully added' })
  @ApiNotFoundResponse({ description: 'Parent, child, or quiz not found' })
  async addQuestion(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Param('quizId') quizId: string,
    @Body() body: QuestionDto,
  ) {
    console.log('Incoming question:', body);
    return this.parentService.addQuestion(parentId, kidId, quizId, body);
  }

  @Patch(':parentId/kids/:kidId/quizzes/:quizId/questions/:questionId')
  @ApiOperation({ summary: 'Update a question' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({ status: 200, description: 'Question successfully updated' })
  @ApiNotFoundResponse({
    description: 'Parent, child, quiz, or question not found',
  })
  async updateQuestion(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() updateData: UpdateQuestionDto,
  ) {
    console.log('Updating question with ID:', questionId);
    return this.parentService.updateQuestion(
      parentId,
      kidId,
      quizId,
      questionId,
      updateData,
    );
  }

  @Delete(':parentId/kids/:kidId/quizzes/:quizId/questions/:questionId')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiParam({ name: 'kidId', description: 'Child ID' })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question successfully deleted' })
  @ApiNotFoundResponse({
    description: 'Parent, child, quiz, or question not found',
  })
  async deleteQuestion(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.parentService.deleteQuestion(
      parentId,
      kidId,
      quizId,
      questionId,
    );
  }


}
