import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Parent } from './schemas/parent.schema';
import * as QRCode from 'qrcode';

@Injectable()
export class ParentService {
  constructor(@InjectModel(Parent.name) private parentModel: Model<Parent>) {}

  // ─────────────────────────────
  // 👨‍👩‍👧 PARENT METHODS
  // ─────────────────────────────

  async createParent(data: any) {
    const parent = new this.parentModel({
      ...data,
      children: [],
      totalScore: 0,
      isActive: true,
    });
    return parent.save();
  }

  async getAllParents() {
    return this.parentModel.find().exec();
  }

  async getParentById(id: string) {
    const parent = await this.parentModel.findById(id);
    if (!parent) throw new NotFoundException('Parent not found');
    return parent;
  }

  async updateParent(id: string, updateData: any) {
    const parent = await this.parentModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );
    if (!parent) throw new NotFoundException('Parent not found');
    return parent;
  }

  async deleteParent(id: string) {
    const deleted = await this.parentModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Parent not found');
    return deleted;
  }

  // ─────────────────────────────
  // 👶 CHILD METHODS
  // ─────────────────────────────

  async addKid(parentId: string, kidData: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    parent.children.push({
      ...kidData,
      quizzes: [],
      score: 0,
    });

    return parent.save();
  }

  async updateKid(parentId: string, kidId: string, updateData: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    Object.assign(child, updateData);
    await parent.save();
    return child;
  }

  async deleteKid(parentId: string, kidId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const index = parent.children.findIndex((c: any) => c._id?.toString() === kidId);
    if (index === -1) throw new NotFoundException('Child not found');

    parent.children.splice(index, 1);
    await parent.save();

    return { message: 'Child deleted successfully' };
  }

  // ✅ Generate QR code for child (using Mongo _id)
  async generateChildQr(parentId: string, childId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === childId);
    if (!child) throw new NotFoundException('Child not found');

    const childUrl = `${child._id}`;
    const qrData = await QRCode.toDataURL(childUrl);

    return { child: { name: child.name, id: child._id }, qr: qrData };
  }

  // ✅ Get child by MongoDB _id (when QR is scanned)
  async getChildById(childId: string) {
  // If childId is a full URL, extract only the ObjectId part
  const cleanId = childId.split('/').pop();

  const parent = await this.parentModel.findOne({ 'children._id': cleanId });
  if (!parent) throw new NotFoundException('Parent not found for this child');

  const child = parent.children.find((c: any) => c._id?.toString() === cleanId);
  if (!child) throw new NotFoundException('Child not found');

  return child;
}


  // ─────────────────────────────
  // 🧩 QUIZ METHODS
  // ─────────────────────────────

  async addQuiz(parentId: string, kidId: string, quizData: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    child.quizzes.push({ ...quizData, questions: [] });
    await parent.save();
    return child.quizzes[child.quizzes.length - 1];
  }

  async getAllQuizzes(parentId: string, kidId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');
    return child.quizzes;
  }

  async getQuizById(parentId: string, kidId: string, quizId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async updateQuiz(parentId: string, kidId: string, quizId: string, updateData: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    Object.assign(quiz, updateData);
    await parent.save();
    return quiz;
  }

  async deleteQuiz(parentId: string, kidId: string, quizId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const index = child.quizzes.findIndex((q: any) => q._id?.toString() === quizId);
    if (index === -1) throw new NotFoundException('Quiz not found');

    child.quizzes.splice(index, 1);
    await parent.save();
    return { message: 'Quiz deleted successfully' };
  }

  // ─────────────────────────────
  // ❓ QUESTION METHODS
  // ─────────────────────────────

  async addQuestion(parentId: string, kidId: string, quizId: string, questionData: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    quiz.questions.push(questionData.question ?? questionData);
    await parent.save();
    return quiz.questions[quiz.questions.length - 1];
  }

  async updateQuestion(
  parentId: string,
  kidId: string,
  quizId: string,
  questionId: string,
  updateData: any,
) {
  const parent = await this.parentModel.findById(parentId);
  if (!parent) throw new NotFoundException('Parent not found');

  const child = parent.children.find((c: any) => c._id?.toString() === kidId);
  if (!child) throw new NotFoundException('Child not found');

  const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
  if (!quiz) throw new NotFoundException('Quiz not found');

  const question = quiz.questions.find((q: any) => q._id?.toString() === questionId);
  if (!question) throw new NotFoundException('Question not found');

  Object.assign(question, updateData);
  parent.markModified('children');
  await parent.save();

  return question;
}




  async deleteQuestion(parentId: string, kidId: string, quizId: string, questionId: string) {
  const parent = await this.parentModel.findById(parentId);
  if (!parent) throw new NotFoundException('Parent not found');

  const child = parent.children.find((c: any) => c._id?.toString() === kidId);
  if (!child) throw new NotFoundException('Child not found');

  const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
  if (!quiz) throw new NotFoundException('Quiz not found');

  const questionIndex = quiz.questions.findIndex((q: any) => q._id?.toString() === questionId);
  if (questionIndex === -1) throw new NotFoundException('Question not found');

  quiz.questions.splice(questionIndex, 1);
  await parent.save();

  return { message: 'Question deleted successfully' };
}


  // ─────────────────────────────
  // 🔍 FIND BY EMAIL
  // ─────────────────────────────
  async findByEmail(email: string) {
    return this.parentModel.findOne({ email }).exec();
  }
}
