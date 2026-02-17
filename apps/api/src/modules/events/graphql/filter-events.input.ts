import { InputType, Field } from '@nestjs/graphql';
import { EventCategory, EventStatus } from '@event-board/shared-types';

@InputType()
export class FilterEventsInput {
  @Field(() => EventCategory, { nullable: true })
  category?: EventCategory;

  @Field(() => EventStatus, { nullable: true })
  status?: EventStatus;

  @Field({ nullable: true })
  startDate?: string;

  @Field({ nullable: true })
  endDate?: string;

  @Field({ nullable: true })
  search?: string;
}
