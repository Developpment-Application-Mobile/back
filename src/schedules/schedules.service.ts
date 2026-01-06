import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schedule, ScheduleDocument } from './schemas/schedule.schema';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
  ) {}

  /**
   * Create a new scheduled activity
   */
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    // Validate that scheduled time is in the future
    const scheduledTime = new Date(createScheduleDto.scheduledTime);
    if (scheduledTime < new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    // Validate activity-specific data
    if (createScheduleDto.activityType === 'quiz' && !createScheduleDto.quizData) {
      throw new BadRequestException('Quiz data is required for quiz activities');
    }
    if (createScheduleDto.activityType === 'game' && !createScheduleDto.gameType) {
      throw new BadRequestException('Game type is required for game activities');
    }
    if (createScheduleDto.activityType === 'puzzle' && !createScheduleDto.puzzleData) {
      throw new BadRequestException('Puzzle data is required for puzzle activities');
    }

    const schedule = new this.scheduleModel({
      ...createScheduleDto,
      parentId: new Types.ObjectId(createScheduleDto.parentId),
      kidId: new Types.ObjectId(createScheduleDto.kidId),
      scheduledTime: scheduledTime,
    });

    return schedule.save();
  }

  /**
   * Get all schedules for a specific child
   */
  async findByKid(parentId: string, kidId: string): Promise<Schedule[]> {
    return this.scheduleModel
      .find({
        parentId: new Types.ObjectId(parentId),
        kidId: new Types.ObjectId(kidId),
      })
      .sort({ scheduledTime: 1 }) // Sort by scheduled time ascending
      .exec();
  }

  /**
   * Get all schedules for a parent (across all children)
   */
  async findByParent(parentId: string): Promise<Schedule[]> {
    return this.scheduleModel
      .find({ parentId: new Types.ObjectId(parentId) })
      .sort({ scheduledTime: 1 })
      .exec();
  }

  /**
   * Get available schedules (scheduled time has passed, not completed)
   */
  async findAvailable(kidId: string): Promise<Schedule[]> {
    const now = new Date();
    return this.scheduleModel
      .find({
        kidId: new Types.ObjectId(kidId),
        scheduledTime: { $lte: now },
        isCompleted: false,
      })
      .sort({ scheduledTime: 1 })
      .exec();
  }

  /**
   * Get upcoming schedules (scheduled time in future, not completed)
   */
  async findUpcoming(kidId: string): Promise<Schedule[]> {
    const now = new Date();
    return this.scheduleModel
      .find({
        kidId: new Types.ObjectId(kidId),
        scheduledTime: { $gt: now },
        isCompleted: false,
      })
      .sort({ scheduledTime: 1 })
      .exec();
  }

  /**
   * Get completed schedules
   */
  async findCompleted(kidId: string): Promise<Schedule[]> {
    return this.scheduleModel
      .find({
        kidId: new Types.ObjectId(kidId),
        isCompleted: true,
      })
      .sort({ completedAt: -1 }) // Most recent first
      .exec();
  }

  /**
   * Get a single schedule by ID
   */
  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleModel.findById(id).exec();
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  /**
   * Update a schedule
   */
  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.scheduleModel
      .findByIdAndUpdate(id, updateScheduleDto, { new: true })
      .exec();

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  /**
   * Mark a schedule as completed
   */
  async markCompleted(
    id: string, 
    score?: number, 
    timeSpent?: number
  ): Promise<Schedule> {
    const schedule = await this.scheduleModel
      .findByIdAndUpdate(
        id,
        {
          isCompleted: true,
          completedAt: new Date(),
          ...(score !== undefined && { score }),
          ...(timeSpent !== undefined && { timeSpent }),
        },
        { new: true },
      )
      .exec();

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  /**
   * Delete a schedule
   */
  async remove(id: string): Promise<void> {
    const result = await this.scheduleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
  }

  /**
   * Bulk sync schedules from mobile app
   */
  async bulkSync(
    parentId: string,
    kidId: string,
    schedules: CreateScheduleDto[],
  ): Promise<Schedule[]> {
    // Delete existing schedules for this kid
    await this.scheduleModel.deleteMany({
      parentId: new Types.ObjectId(parentId),
      kidId: new Types.ObjectId(kidId),
    });

    // Create new schedules
    const createdSchedules = await Promise.all(
      schedules.map(schedule => this.create(schedule)),
    );

    return createdSchedules;
  }

  /**
   * Get schedule statistics for a child
   */
  async getStats(kidId: string) {
    const [total, completed, available, upcoming] = await Promise.all([
      this.scheduleModel.countDocuments({ kidId: new Types.ObjectId(kidId) }),
      this.scheduleModel.countDocuments({ 
        kidId: new Types.ObjectId(kidId), 
        isCompleted: true 
      }),
      this.scheduleModel.countDocuments({
        kidId: new Types.ObjectId(kidId),
        scheduledTime: { $lte: new Date() },
        isCompleted: false,
      }),
      this.scheduleModel.countDocuments({
        kidId: new Types.ObjectId(kidId),
        scheduledTime: { $gt: new Date() },
        isCompleted: false,
      }),
    ]);

    const avgScore = await this.scheduleModel.aggregate([
      { 
        $match: { 
          kidId: new Types.ObjectId(kidId), 
          isCompleted: true,
          score: { $exists: true }
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgScore: { $avg: '$score' } 
        } 
      },
    ]);

    return {
      total,
      completed,
      available,
      upcoming,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      averageScore: avgScore.length > 0 ? avgScore[0].avgScore : 0,
    };
  }
}