const { createClient } = require('redis');
require('dotenv').config();
const client = createClient({
  url: process.env.REDIS_SERVICE
});
client.on('connect', () => {
  console.log('Connected to Redis...');
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

client.connect().catch(console.error);

module.exports = client;
