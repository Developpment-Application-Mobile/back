import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Uncomment if you have auth

@Controller('schedules')
// @UseGuards(JwtAuthGuard) // Uncomment to protect routes
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  /**
   * POST /schedules
   * Create a new scheduled activity
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  /**
   * GET /schedules/parent/:parentId/kid/:kidId
   * Get all schedules for a specific child
   */
  @Get('parent/:parentId/kid/:kidId')
  async findByKid(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
  ) {
    return this.schedulesService.findByKid(parentId, kidId);
  }

  /**
   * GET /schedules/parent/:parentId
   * Get all schedules for a parent (all children)
   */
  @Get('parent/:parentId')
  async findByParent(@Param('parentId') parentId: string) {
    return this.schedulesService.findByParent(parentId);
  }

  /**
   * GET /schedules/kid/:kidId/available
   * Get available schedules (time has passed, not completed)
   */
  @Get('kid/:kidId/available')
  async findAvailable(@Param('kidId') kidId: string) {
    return this.schedulesService.findAvailable(kidId);
  }

  /**
   * GET /schedules/kid/:kidId/upcoming
   * Get upcoming schedules (time in future, not completed)
   */
  @Get('kid/:kidId/upcoming')
  async findUpcoming(@Param('kidId') kidId: string) {
    return this.schedulesService.findUpcoming(kidId);
  }

  /**
   * GET /schedules/kid/:kidId/completed
   * Get completed schedules
   */
  @Get('kid/:kidId/completed')
  async findCompleted(@Param('kidId') kidId: string) {
    return this.schedulesService.findCompleted(kidId);
  }

  /**
   * GET /schedules/kid/:kidId/stats
   * Get schedule statistics for a child
   */
  @Get('kid/:kidId/stats')
  async getStats(@Param('kidId') kidId: string) {
    return this.schedulesService.getStats(kidId);
  }

  /**
   * GET /schedules/:id
   * Get a single schedule by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  /**
   * PUT /schedules/:id
   * Update a schedule
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  /**
   * PUT /schedules/:id/complete
   * Mark a schedule as completed
   */
  @Put(':id/complete')
  async markCompleted(
    @Param('id') id: string,
    @Body() body: { score?: number; timeSpent?: number },
  ) {
    return this.schedulesService.markCompleted(id, body.score, body.timeSpent);
  }

  /**
   * DELETE /schedules/:id
   * Delete a schedule
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.schedulesService.remove(id);
  }

  /**
   * POST /schedules/sync
   * Bulk sync schedules from mobile app
   */
  @Post('sync')
  async bulkSync(
    @Body()
    body: {
      parentId: string;
      kidId: string;
      schedules: CreateScheduleDto[];
    },
  ) {
    return this.schedulesService.bulkSync(
      body.parentId,
      body.kidId,
      body.schedules,
    );
  }
}