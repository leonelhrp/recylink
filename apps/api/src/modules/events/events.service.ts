import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<EventDocument> {
    const event = new this.eventModel(createEventDto);
    return event.save();
  }

  async findAll(filterDto: FilterEventsDto): Promise<EventDocument[]> {
    const query: Record<string, any> = {};

    if (filterDto.category) {
      query.category = filterDto.category;
    }

    if (filterDto.status) {
      query.status = filterDto.status;
    }

    if (filterDto.startDate || filterDto.endDate) {
      query.date = {};
      if (filterDto.startDate) {
        query.date.$gte = new Date(filterDto.startDate);
      }
      if (filterDto.endDate) {
        query.date.$lte = new Date(filterDto.endDate);
      }
    }

    if (filterDto.search) {
      query.$or = [
        { title: { $regex: filterDto.search, $options: 'i' } },
        { description: { $regex: filterDto.search, $options: 'i' } },
        { organizer: { $regex: filterDto.search, $options: 'i' } },
      ];
    }

    return this.eventModel.find(query).sort({ date: 1 }).exec();
  }

  async findOne(id: string): Promise<EventDocument> {
    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventDocument> {
    const event = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return event;
  }

  async remove(id: string): Promise<EventDocument> {
    const event = await this.eventModel.findByIdAndDelete(id).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return event;
  }
}
