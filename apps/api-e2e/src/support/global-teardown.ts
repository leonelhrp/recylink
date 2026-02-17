module.exports = async function () {
  console.log('\nStopping MongoDB Memory Server...\n');
  const mongod = (globalThis as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
  }
};
