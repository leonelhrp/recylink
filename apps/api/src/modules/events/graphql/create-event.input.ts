import { InputType, Field } from '@nestjs/graphql';
import { EventCategory, EventStatus } from '@event-board/shared-types';

@InputType()
export class CreateEventInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  date: string;

  @Field()
  location: string;

  @Field(() => EventCategory)
  category: EventCategory;

  @Field()
  organizer: string;

  @Field(() => EventStatus, { nullable: true, defaultValue: EventStatus.DRAFT })
  status?: EventStatus;
}
