// src/shared/utils/idempotency.js
const prisma = require('../../config/database');

/**
 * Check if an idempotency key has been processed before.
 * Returns cached response if exists, null otherwise.
 */
const checkIdempotency = async (key) => {
  if (!key) return null;
  return await prisma.idempotencyKey.findUnique({ where: { key } });
};

/**
 * Save the result of processing an idempotency key.
 */
const saveIdempotency = async (key, response, statusCode) => {
  if (!key) return;
  await prisma.idempotencyKey.create({
    data: { key, response, statusCode },
  });
};

module.exports = { checkIdempotency, saveIdempotency };
