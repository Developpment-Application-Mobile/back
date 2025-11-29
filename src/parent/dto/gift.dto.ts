import { ApiProperty } from '@nestjs/swagger';

export class CreateGiftDto {
    @ApiProperty({ description: 'The name of the gift', example: 'Lego Set' })
    title: string;

    @ApiProperty({ description: 'The cost of the gift in points', example: 500 })
    cost: number;

}
