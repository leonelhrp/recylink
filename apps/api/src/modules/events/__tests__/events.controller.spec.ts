import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { EventsController } from '../events.controller';
import { EventsService } from '../events.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EventCategory, EventStatus } from '@event-board/shared-types';

const mockEvent = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Workshop',
  description: 'A test workshop description',
  date: '2026-03-15T10:00:00.000Z',
  location: 'Room 3',
  category: EventCategory.WORKSHOP,
  organizer: 'John Doe',
  status: EventStatus.DRAFT,
  createdAt: '2026-02-15T00:00:00.000Z',
  updatedAt: '2026-02-15T00:00:00.000Z',
};

const mockEventsService = {
  create: jest.fn().mockResolvedValue(mockEvent),
  findAll: jest.fn().mockResolvedValue([mockEvent]),
  findOne: jest.fn().mockResolvedValue(mockEvent),
  update: jest.fn().mockResolvedValue(mockEvent),
  remove: jest.fn().mockResolvedValue(mockEvent),
};

describe('EventsController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: mockEventsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/events', () => {
    it('should return an array of events', () => {
      return request(app.getHttpServer())
        .get('/api/events')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0].title).toBe('Test Workshop');
        });
    });

    it('should accept category filter', () => {
      return request(app.getHttpServer())
        .get('/api/events?category=workshop')
        .expect(200);
    });

    it('should accept status filter', () => {
      return request(app.getHttpServer())
        .get('/api/events?status=draft')
        .expect(200);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return a single event', () => {
      return request(app.getHttpServer())
        .get('/api/events/507f1f77bcf86cd799439011')
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Test Workshop');
          expect(res.body.category).toBe(EventCategory.WORKSHOP);
        });
    });
  });

  describe('POST /api/events', () => {
    it('should create a new event with valid data', () => {
      return request(app.getHttpServer())
        .post('/api/events')
        .send({
          title: 'New Event',
          description: 'A new event description',
          date: '2026-04-01T10:00:00.000Z',
          location: 'Room 5',
          category: EventCategory.MEETUP,
          organizer: 'Jane Doe',
        })
        .expect(201);
    });

    it('should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/events')
        .send({
          title: 'AB',
          description: '',
          category: 'invalid',
        })
        .expect(400);
    });
  });

  describe('PATCH /api/events/:id', () => {
    it('should update an event', () => {
      return request(app.getHttpServer())
        .patch('/api/events/507f1f77bcf86cd799439011')
        .send({ title: 'Updated Workshop' })
        .expect(200);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', () => {
      return request(app.getHttpServer())
        .delete('/api/events/507f1f77bcf86cd799439011')
        .expect(200);
    });
  });
});
