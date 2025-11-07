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
import { KidService } from './kid.service';
import { Types } from 'mongoose';

// DTOs
class GenerateQrDto {
  kidId: string;
}

class ScanQrDto {
  token: string;
}

class SubmitResultDto {
  kidId: string;
  quizId: string;
  score: number;
}

class UpdateKidDto {
  name?: string;
  age?: number;
  interests?: string[];
  avatarUrl?: string;
}

@Controller('kids')
export class KidController {
  constructor(private readonly kidService: KidService) {}

  // Generate or get existing QR token for a kid (parent will call this)
  @Post('generate-qr')
  async generateQr(@Body() body: GenerateQrDto) {
    if (!body.kidId) throw new BadRequestException('kidId required');
    return { token: await this.kidService.generateOrGetQrToken(body.kidId) };
  }

  // Kid app: scan QR token and return linked kid info
  @Post('scan-qr')
  async scanQr(@Body() body: ScanQrDto) {
    if (!body.token) throw new BadRequestException('token required');
    const kid = await this.kidService.findByQrToken(body.token);
    return { id: kid._id, name: kid.name, age: kid.age, interests: kid.interests };
  }

  // Kid submits quiz result (after finishing quiz)
  @Post('submit-result')
  async submitResult(@Body() body: SubmitResultDto) {
    if (!body.kidId || !body.quizId || typeof body.score !== 'number')
      throw new BadRequestException('missing fields');
    return this.kidService.saveQuizResult(body.kidId, body.quizId, body.score);
  }

  // Get quiz history for a kid
  @Get(':kidId/history')
  async history(@Param('kidId') kidId: string) {
    if (!Types.ObjectId.isValid(kidId)) throw new BadRequestException('Invalid kid id');
    return this.kidService.getQuizHistory(kidId);
  }

  // ✅ Update kid info
  @Patch(':kidId')
  async updateKid(@Param('kidId') kidId: string, @Body() body: UpdateKidDto) {
    if (!Types.ObjectId.isValid(kidId)) throw new BadRequestException('Invalid kid id');
    const updated = await this.kidService.update(kidId, body);
    if (!updated) throw new BadRequestException('Kid not found');
    return { message: 'Kid updated successfully', updated };
  }

  // ✅ Delete kid
  @Delete(':kidId')
  async deleteKid(@Param('kidId') kidId: string) {
    if (!Types.ObjectId.isValid(kidId)) throw new BadRequestException('Invalid kid id');
    const deleted = await this.kidService.remove(kidId);
    if (!deleted) throw new BadRequestException('Kid not found');
    return { message: 'Kid deleted successfully' };
  }
}
