import { EventCategory, EventStatus } from './enums';

export interface IEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: EventCategory;
  organizer: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateEventDto {
  title: string;
  description: string;
  date: string;
  location: string;
  category: EventCategory;
  organizer: string;
  status?: EventStatus;
}

export interface IUpdateEventDto {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  category?: EventCategory;
  organizer?: string;
  status?: EventStatus;
}

export interface IFilterEventsDto {
  category?: EventCategory;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}
