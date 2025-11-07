import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz } from './schemas/quiz.schema';
import { Kid } from '../kid/schemas/kid.schema';

/**
 * QuizService contains basic quiz creation and retrieval.
 * The AI quiz generation is represented by a private stub
 * `generateQuizFromInterests()` — replace with your AI logic.
 */
@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(Kid.name) private kidModel: Model<Kid>,
  ) {}

  async createQuizForKid(
    kidId: string,
    opts: { title?: string; topics?: string[]; difficulty?: string },
  ) {
    if (!Types.ObjectId.isValid(kidId)) throw new NotFoundException('Invalid kid id');
    const kid = await this.kidModel.findById(kidId);
    if (!kid) throw new NotFoundException('Kid not found');

    const title = opts.title ?? `Quiz for ${kid.name}`;
    const topics = opts.topics ?? kid.interests ?? [];
    const difficulty = opts.difficulty ?? 'easy';

    // call AI generator (stubbed)
    const questions = this.generateQuizFromInterests(kid.name, topics, difficulty, kid.age);

    const quiz = new this.quizModel({
      title,
      topics,
      createdFor: kid._id,
      questions,
      aiGenerated: true,
      difficulty,
    });

    return quiz.save();
  }

  async getQuiz(quizId: string) {
    if (!Types.ObjectId.isValid(quizId)) throw new NotFoundException('Invalid quiz id');
    const quiz = await this.quizModel.findById(quizId).exec();
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  // Example: kid requests "next quiz" by QR token flow -> create a quiz for them on demand
  async createQuizByQrToken(kidToken: string) {
    const kid = await this.kidModel.findOne({ qrCodeToken: kidToken });
    if (!kid) throw new NotFoundException('Kid not found for token');
    // ✅ fixed _id type issue
    return this.createQuizForKid(String(kid._id), {});
  }

  // VERY simple stub — replace with integration to your AI generator/service
  private generateQuizFromInterests(
    kidName: string,
    topics: string[],
    difficulty: string,
    age: number,
  ): { question: string; options: string[]; correctAnswer: string }[] {
    // ✅ explicitly typed array
    const qs: { question: string; options: string[]; correctAnswer: string }[] = [];
    const base = topics.length ? topics : ['General Knowledge', 'Math', 'Animals'];
    for (let i = 0; i < 5; i++) {
      const topic = base[i % base.length];
      const q = `Question (${topic}) #${i + 1} for ${kidName}`;
      const options = ['A', 'B', 'C', 'D'].map((opt) => `${opt} - option ${i + 1}`);
      const correct = options[0];
      qs.push({ question: q, options, correctAnswer: correct });
    }
    return qs;
  }
  async updateQuiz(id: string, data: any) {
  return this.quizModel.findByIdAndUpdate(id, data, { new: true });
}

async deleteQuiz(id: string) {
  return this.quizModel.findByIdAndDelete(id);
}

async getAllQuizzes() {
  return this.quizModel.find();
}

}
