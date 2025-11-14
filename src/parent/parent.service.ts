import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Parent } from './schemas/parent.schema';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const updates: any = {};

    if (
      updateData.name !== undefined &&
      updateData.name !== null &&
      updateData.name !== ''
    ) {
      updates.name = updateData.name;
    }

    if (
      updateData.email !== undefined &&
      updateData.email !== null &&
      updateData.email !== ''
    ) {
      updates.email = updateData.email;
    }

    if (
      updateData.password !== undefined &&
      updateData.password !== null &&
      updateData.password !== ''
    ) {
      const hashed = await bcrypt.hash(updateData.password, 10);
      updates.password = hashed;
    }

    if (!Object.keys(updates).length) {
      const existing = await this.parentModel.findById(id);
      if (!existing) throw new NotFoundException('Parent not found');
      return existing;
    }

    const parent = await this.parentModel.findByIdAndUpdate(
      id,
      { $set: updates },
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

    const index = parent.children.findIndex(
      (c: any) => c._id?.toString() === kidId,
    );
    if (index === -1) throw new NotFoundException('Child not found');

    parent.children.splice(index, 1);
    await parent.save();

    return { message: 'Child deleted successfully' };
  }

  // ✅ Generate QR code for child (using Mongo _id)
  async generateChildQr(parentId: string, childId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find(
      (c: any) => c._id?.toString() === childId,
    );
    if (!child) throw new NotFoundException('Child not found');

    const childUrl = child._id?.toString();
    const qrData = await QRCode.toDataURL(childUrl);

    return { child: { name: child.name, id: child._id }, qr: qrData };
  }

  // ✅ Get child by MongoDB _id (when QR is scanned)
  async getChildById(childId: string) {
    const parent = await this.parentModel.findOne({ 'children._id': childId });
    if (!parent) throw new NotFoundException('Parent not found for this child');

    const child = parent.children.find(
      (c: any) => c._id?.toString() === childId,
    );
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

    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new NotFoundException('Missing GOOGLE_API_KEY');
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const subject = quizData.subject;
    const difficulty = quizData.difficulty;
    const nbrQuestions = quizData.nbrQuestions;
    const topic = quizData.topic;

    const title = `${subject}${topic ? ` - ${topic}` : ''} Quiz`;

    const prompt =
      `Generate a JSON object for a quiz with the following structure:\n` +
      `{"title":"string","type":"string","answered":0,"score":0,"questions":[{"questionText":"string","options":["string","string","string","string"],"correctAnswerIndex":0,"explanation":"string","imageUrl":"string","type":"string","level":"string"}]}` +
      `\nRequirements:\n- subject: ${subject}\n- difficulty: ${difficulty}\n- number_of_questions: ${nbrQuestions}\n- topic: ${topic || 'none'}\n- Ensure strict JSON output, no markdown, no extra text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('Gemini API response:', text);
    let parsedText = text?.trim() ?? '';
    if (parsedText.startsWith('```')) {
      parsedText = parsedText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();
    }
    let generated;
    try {
      generated = JSON.parse(parsedText);
    } catch {
      const start = parsedText.indexOf('{');
      const end = parsedText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = parsedText.slice(start, end + 1);
        try {
          generated = JSON.parse(candidate);
        } catch {
          throw new NotFoundException(
            'Failed to parse quiz generation response',
          );
        }
      } else {
        throw new NotFoundException('Failed to parse quiz generation response');
      }
    }

    const quiz = {
      title: generated.title || title,
      type: generated.type || subject,
      answered: 0,
      score: generated.score ?? 0,
      questions: Array.isArray(generated.questions)
        ? generated.questions.map((q: any) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            explanation: q.explanation,
            imageUrl: q.imageUrl,
            type: q.type || subject,
            level: q.level || difficulty,
          }))
        : [],
    };

    child.quizzes.push(quiz);
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

  async updateQuiz(
    parentId: string,
    kidId: string,
    quizId: string,
    updateData: any,
  ) {
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

    const index = child.quizzes.findIndex(
      (q: any) => q._id?.toString() === quizId,
    );
    if (index === -1) throw new NotFoundException('Quiz not found');

    child.quizzes.splice(index, 1);
    await parent.save();
    return { message: 'Quiz deleted successfully' };
  }

  // ─────────────────────────────
  // ❓ QUESTION METHODS
  // ─────────────────────────────

  async addQuestion(
    parentId: string,
    kidId: string,
    quizId: string,
    questionData: any,
  ) {
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

    const question = quiz.questions.find(
      (q: any) => q._id?.toString() === questionId,
    );
    if (!question) throw new NotFoundException('Question not found');

    Object.assign(question, updateData);
    parent.markModified('children');
    await parent.save();

    return question;
  }

  async deleteQuestion(
    parentId: string,
    kidId: string,
    quizId: string,
    questionId: string,
  ) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    const questionIndex = quiz.questions.findIndex(
      (q: any) => q._id?.toString() === questionId,
    );
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
