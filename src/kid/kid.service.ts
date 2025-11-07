import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Kid } from './schemas/kid.schema';
import { v4 as uuidv4 } from 'uuid';
import { Quiz } from '../quiz/schemas/quiz.schema';

@Injectable()
export class KidService {
  constructor(
    @InjectModel(Kid.name) private kidModel: Model<Kid>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
  ) {}

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid id');
    return this.kidModel.findById(id).exec();
  }

  async generateOrGetQrToken(kidId: string) {
    const kid = await this.kidModel.findById(kidId);
    if (!kid) throw new NotFoundException('Kid not found');

    if (kid.qrCodeToken) return kid.qrCodeToken;
    // generate a unique token (UUID) - small token, not exposing DB id
    const token = uuidv4();
    kid.qrCodeToken = token;
    await kid.save();
    return token;
  }

  async findByQrToken(token: string) {
    const kid = await this.kidModel.findOne({ qrCodeToken: token });
    if (!kid) throw new NotFoundException('QR token not found');
    return kid;
  }

  async saveQuizResult(kidId: string, quizId: string, score: number) {
  const kid = await this.kidModel.findById(kidId);
  if (!kid) throw new NotFoundException('Kid not found');

  kid.quizHistory.push({
    quizId: new Types.ObjectId(quizId), // ✅ FIXED
    score,
    dateTaken: new Date(),
  });

  // optionally update learningLevel
  kid.learningLevel = Math.min(100, kid.learningLevel + Math.round(score / 10));
  await kid.save();

  // update quiz doc if needed
  return kid;
}


  async getQuizHistory(kidId: string) {
    const kid = await this.kidModel.findById(kidId).populate({
      path: 'quizHistory.quizId',
      model: this.quizModel.modelName,
    });
    if (!kid) throw new NotFoundException('Kid not found');
    return kid.quizHistory;
  }

  async update(id: string, updateData: any) {
  return this.kidModel.findByIdAndUpdate(id, updateData, { new: true });
}

async remove(id: string) {
  return this.kidModel.findByIdAndDelete(id);
}

}
