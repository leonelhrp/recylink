import {
  IsString,
  IsEnum,
  IsDateString,
  MinLength,
  IsOptional,
} from 'class-validator';
import { EventCategory, EventStatus } from '@event-board/shared-types';

export class CreateEventDto {
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title: string;

  @IsString()
  @MinLength(1, { message: 'Description is required' })
  description: string;

  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  date: string;

  @IsString()
  @MinLength(1, { message: 'Location is required' })
  location: string;

  @IsEnum(EventCategory, {
    message: `Category must be one of: ${Object.values(EventCategory).join(', ')}`,
  })
  category: EventCategory;

  @IsString()
  @MinLength(1, { message: 'Organizer is required' })
  organizer: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: `Status must be one of: ${Object.values(EventStatus).join(', ')}`,
  })
  status?: EventStatus;
}
