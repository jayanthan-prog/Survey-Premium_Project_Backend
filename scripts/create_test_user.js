// Usage: node scripts/create_test_user.js <email> [name]
'use strict';
const db = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function run() {
  const email = process.argv[2] || 'tester@example.com';
  const name = process.argv[3] || 'Test User';

  try {
    await db.sequelize.authenticate();
    console.log('DB connection OK');

    const User = db.User;
    if (!User) throw new Error('User model not found');

    // Check if a user with email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('User already exists:', existing.user_id, existing.email);
      process.exit(0);
    }

    const created = await User.create({
      user_id: uuidv4(),
      name,
      email,
      created_at: new Date(),
    });

    console.log('Created user:');
    console.log({ user_id: created.user_id, email: created.email, name: created.name });
    process.exit(0);
  } catch (err) {
    console.error('Error creating user:', err && (err.stack || err));
    process.exit(1);
  }
}

run();
