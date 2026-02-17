import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventType } from './graphql/event.type';
import { CreateEventInput } from './graphql/create-event.input';
import { FilterEventsInput } from './graphql/filter-events.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => EventType)
export class EventsResolver {
  constructor(private readonly eventsService: EventsService) {}

  @Query(() => [EventType], { name: 'events' })
  async findAll(
    @Args('filter', { nullable: true }) filter?: FilterEventsInput,
  ) {
    return this.eventsService.findAll(filter || {});
  }

  @Query(() => EventType, { name: 'event' })
  async findOne(@Args('id', { type: () => ID }) id: string) {
    return this.eventsService.findOne(id);
  }

  @Mutation(() => EventType)
  @UseGuards(GqlAuthGuard)
  async createEvent(@Args('input') input: CreateEventInput) {
    return this.eventsService.create(input);
  }
}
