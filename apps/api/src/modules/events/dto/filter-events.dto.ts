import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { EventCategory, EventStatus } from '@event-board/shared-types';

export class FilterEventsDto {
  @IsOptional()
  @IsEnum(EventCategory, {
    message: `Category must be one of: ${Object.values(EventCategory).join(', ')}`,
  })
  category?: EventCategory;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: `Status must be one of: ${Object.values(EventStatus).join(', ')}`,
  })
  status?: EventStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
