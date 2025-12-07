import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class GenerateReviewDto {
    // No parameters needed - reviews automatically analyze all topics from the last 30 days
}

export class TopicPerformance {
    @ApiProperty({ description: 'Topic name', example: 'math' })
    topic: string;

    @ApiProperty({ description: 'Number of quizzes completed', example: 5 })
    quizzesCompleted: number;

    @ApiProperty({ description: 'Average score percentage', example: 85.5 })
    averageScore: number;

    @ApiProperty({ description: 'Highest score achieved', example: 95 })
    highestScore: number;

    @ApiProperty({ description: 'Lowest score achieved', example: 70 })
    lowestScore: number;
}

export class ChildReviewResponseDto {
    @ApiProperty({ description: 'Child name', example: 'John Doe' })
    childName: string;

    @ApiProperty({ description: 'Child age', example: 8 })
    childAge: number;

    @ApiProperty({ description: 'Child level', example: 'beginner' })
    childLevel: string;

    @ApiProperty({ description: 'Current progression level', example: 3 })
    progressionLevel: number;

    @ApiProperty({ description: 'Total quizzes completed', example: 15 })
    totalQuizzes: number;

    @ApiProperty({ description: 'Overall average score', example: 82.3 })
    overallAverage: number;

    @ApiProperty({ description: 'Total lifetime score', example: 2500 })
    lifetimeScore: number;

    @ApiProperty({ description: 'Current available points', example: 1200 })
    currentScore: number;

    @ApiProperty({
        description: 'Performance breakdown by topic',
        type: [TopicPerformance],
    })
    performanceByTopic: TopicPerformance[];

    @ApiProperty({
        description: 'AI-generated comprehensive analysis of what the child excels at across ALL topics',
        example: 'Your child demonstrates strong analytical skills across mathematics and science, consistently scoring above 85%. They show excellent problem-solving abilities and quick comprehension of complex concepts in multiple subjects.',
    })
    strengths: string;

    @ApiProperty({
        description: 'AI-generated comprehensive analysis of areas needing improvement across ALL topics',
        example: 'While performing well overall, general knowledge topics require additional attention. The child would benefit from more practice in reading comprehension and vocabulary building across all subjects.',
    })
    weaknesses: string;

    @ApiProperty({
        description: 'AI-generated actionable recommendations for parents covering ALL subjects and learning areas',
        example: '• Continue encouraging math practice to maintain excellence\n• Introduce science experiments at home to build interest\n• Use educational videos for general knowledge topics\n• Schedule regular reading sessions to improve comprehension\n• Celebrate achievements across all subjects to build confidence',
    })
    recommendations: string;

    @ApiProperty({
        description: 'Overall AI-generated summary of the child\'s complete learning journey across all subjects',
        example: 'Your child is making excellent progress overall with a strong foundation in mathematics and science. With focused attention on general knowledge topics and continued practice across all subjects, they have great potential for well-rounded academic development. Their enthusiasm for learning and consistent effort are commendable.',
    })
    summary: string;

    @ApiProperty({ description: 'Review generation date', example: '2024-12-05T10:00:00.000Z' })
    generatedAt: Date;

    @ApiProperty({
        description: 'Base64-encoded PDF of the review report',
        example: 'JVBERi0xLjQKJeLjz9MKMy...'
    })
    pdfBase64: string;
}