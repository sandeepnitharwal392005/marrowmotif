const { Redis } = require('ioredis');
const redis = new Redis('redis://localhost:6379');
redis.keys('*').then(keys => {
  console.log('Redis Keys:', keys);
  process.exit(0);
}).catch(console.error);
