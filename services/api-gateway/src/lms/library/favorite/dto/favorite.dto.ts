import { IsEnum, IsString } from 'class-validator';

export type ItemType = 'BOOK' | 'GUIDE' | 'PRESENTATION';

export class ToggleFavoriteDto {
  @IsEnum(['BOOK', 'GUIDE', 'PRESENTATION'])
  itemType: ItemType;

  @IsString()
  itemId: string;
}
