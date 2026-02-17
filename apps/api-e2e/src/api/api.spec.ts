import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../apps/api/src/app/app.module';
import { EventCategory, EventStatus } from '@event-board/shared-types';

describe('EventBoard API (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdEventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['graphql'] });
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

  describe('Auth flow', () => {
    it('POST /api/auth/register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user.name).toBe('Test User');
        });
    });

    it('POST /api/auth/register - should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Another User',
        })
        .expect(409);
    });

    it('POST /api/auth/login - should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          accessToken = res.body.access_token;
        });
    });

    it('POST /api/auth/login - should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Events CRUD', () => {
    it('POST /api/events - should create event when authenticated', () => {
      return request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'E2E Workshop',
          description: 'An end-to-end testing workshop',
          date: '2026-06-15T10:00:00.000Z',
          location: 'Room 1',
          category: EventCategory.WORKSHOP,
          organizer: 'Test User',
          status: EventStatus.CONFIRMED,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body._id).toBeDefined();
          expect(res.body.title).toBe('E2E Workshop');
          expect(res.body.category).toBe(EventCategory.WORKSHOP);
          createdEventId = res.body._id;
        });
    });

    it('POST /api/events - should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .post('/api/events')
        .send({
          title: 'Unauthorized Event',
          description: 'Should fail',
          date: '2026-06-15T10:00:00.000Z',
          location: 'Room 2',
          category: EventCategory.MEETUP,
          organizer: 'Nobody',
        })
        .expect(401);
    });

    it('POST /api/events - should reject invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'AB',
          category: 'invalid',
        })
        .expect(400);
    });

    it('GET /api/events - should list events (public)', () => {
      return request(app.getHttpServer())
        .get('/api/events')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('GET /api/events?category=workshop - should filter by category', () => {
      return request(app.getHttpServer())
        .get('/api/events?category=workshop')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((event: any) => {
            expect(event.category).toBe(EventCategory.WORKSHOP);
          });
        });
    });

    it('GET /api/events/:id - should get event detail', () => {
      return request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('E2E Workshop');
          expect(res.body._id).toBe(createdEventId);
        });
    });

    it('PATCH /api/events/:id - should update event when authenticated', () => {
      return request(app.getHttpServer())
        .patch(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated E2E Workshop' })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated E2E Workshop');
        });
    });

    it('DELETE /api/events/:id - should delete event when authenticated', () => {
      return request(app.getHttpServer())
        .delete(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('GET /api/events/:id - should return 404 for deleted event', () => {
      return request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(404);
    });
  });
});
