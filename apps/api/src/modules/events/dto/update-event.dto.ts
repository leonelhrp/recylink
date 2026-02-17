import {
  IsString,
  IsEnum,
  IsDateString,
  MinLength,
  IsOptional,
} from 'class-validator';
import { EventCategory, EventStatus } from '@event-board/shared-types';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  date?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(EventCategory, {
    message: `Category must be one of: ${Object.values(EventCategory).join(', ')}`,
  })
  category?: EventCategory;

  @IsOptional()
  @IsString()
  organizer?: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: `Status must be one of: ${Object.values(EventStatus).join(', ')}`,
  })
  status?: EventStatus;
}
