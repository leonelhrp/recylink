import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from '../events.service';
import { Event } from '../schemas/event.schema';
import { EventCategory, EventStatus } from '@event-board/shared-types';

const mockEvent = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Workshop',
  description: 'A test workshop description',
  date: new Date('2026-03-15T10:00:00Z'),
  location: 'Room 3',
  category: EventCategory.WORKSHOP,
  organizer: 'John Doe',
  status: EventStatus.DRAFT,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEventModel = {
  new: jest.fn().mockResolvedValue(mockEvent),
  constructor: jest.fn().mockResolvedValue(mockEvent),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  exec: jest.fn(),
};

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: {
            ...mockEventModel,
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockEvent]),
              }),
            }),
            findById: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockEvent),
            }),
            findByIdAndUpdate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockEvent),
            }),
            findByIdAndDelete: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockEvent),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      const result = await service.findAll({});
      expect(result).toEqual([mockEvent]);
    });

    it('should apply category filter', async () => {
      await service.findAll({ category: EventCategory.WORKSHOP });
      expect(
        (service as any).eventModel.find,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ category: EventCategory.WORKSHOP }),
      );
    });

    it('should apply status filter', async () => {
      await service.findAll({ status: EventStatus.CONFIRMED });
      expect(
        (service as any).eventModel.find,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ status: EventStatus.CONFIRMED }),
      );
    });

    it('should apply date range filter', async () => {
      await service.findAll({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });
      expect(
        (service as any).eventModel.find,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          date: {
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          },
        }),
      );
    });

    it('should apply search filter', async () => {
      await service.findAll({ search: 'workshop' });
      expect(
        (service as any).eventModel.find,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({ title: expect.any(Object) }),
          ]),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn((service as any).eventModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the event', async () => {
      const result = await service.update('507f1f77bcf86cd799439011', {
        title: 'Updated Title',
      });
      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException if event not found for update', async () => {
      jest
        .spyOn((service as any).eventModel, 'findByIdAndUpdate')
        .mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });

      await expect(
        service.update('nonexistent', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return the event', async () => {
      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException if event not found for deletion', async () => {
      jest
        .spyOn((service as any).eventModel, 'findByIdAndDelete')
        .mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
