import { IsEnum, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ItemType = 'BOOK' | 'GUIDE' | 'PRESENTATION';

export class ToggleFavoriteDto {
  @ApiProperty({
    description: 'Type of item to favorite',
    enum: ['BOOK', 'GUIDE', 'PRESENTATION'],
    example: 'BOOK',
    type: String,
  })
  @IsEnum(['BOOK', 'GUIDE', 'PRESENTATION'])
  itemType: ItemType;

  @ApiProperty({
    description: 'Unique identifier of the item',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsString()
  itemId: string;
}
