import { MongoMemoryServer } from 'mongodb-memory-server';

module.exports = async function () {
  console.log('\nStarting MongoDB Memory Server...\n');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.PORT = '0';

  (globalThis as any).__MONGOD__ = mongod;
};
