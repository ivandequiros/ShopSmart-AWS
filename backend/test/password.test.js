import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/lib/password.js';
import { loginSchema, registerSchema } from '../src/validators/schemas.js';

test('a hashed password verifies and never stores the plain text', async () => {
  const stored = await hashPassword('classroom-pass-1');
  assert.ok(!stored.includes('classroom-pass-1'));
  assert.equal(await verifyPassword('classroom-pass-1', stored), true);
  assert.equal(await verifyPassword('wrong-password', stored), false);
});

test('registration requires a password of at least 8 characters', () => {
  assert.equal(registerSchema.safeParse({ name: 'Ana Reyes', email: 'ana@example.com', password: 'short' }).success, false);
});

test('login normalizes email case and spacing', () => {
  const result = loginSchema.safeParse({ email: '  Ana@Example.COM ', password: 'x' });
  assert.equal(result.success, true);
  assert.equal(result.data.email, 'ana@example.com');
});
