import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EventCategory, EventStatus } from '@event-board/shared-types';

export type EventDocument = HydratedDocument<Event>;

// Explicit string arrays for Mongoose runtime (bundled build loses enum metadata)
const CATEGORY_VALUES = Object.values(EventCategory) as string[];
const STATUS_VALUES = Object.values(EventStatus) as string[];

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, minlength: 3 })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, type: String, enum: CATEGORY_VALUES })
  category: EventCategory;

  @Prop({ required: true })
  organizer: string;

  @Prop({ required: true, type: String, enum: STATUS_VALUES, default: EventStatus.DRAFT })
  status: EventStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
