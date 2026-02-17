import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { EventCategory, EventStatus } from '@event-board/shared-types';

registerEnumType(EventCategory, { name: 'EventCategory' });
registerEnumType(EventStatus, { name: 'EventStatus' });

@ObjectType('Event')
export class EventType {
  @Field(() => ID)
  _id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  date: Date;

  @Field()
  location: string;

  @Field(() => EventCategory)
  category: EventCategory;

  @Field()
  organizer: string;

  @Field(() => EventStatus)
  status: EventStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
