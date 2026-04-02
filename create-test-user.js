#!/usr/bin/env node
/**
 * Script to create a test user and generate an auth token for API testing
 * Usage: node create-test-user.js
 */

require('dotenv').config();
const db = require('./src/models');
const { User, AuthToken } = db;
const crypto = require('crypto');

async function createTestUser() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Create or find test user
    let user = await User.findOne({ where: { email: 'test@example.com' } });
    
    if (!user) {
      console.log('Creating test user...');
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        is_active: true,
        attributes: {},
      });
      console.log(`✅ Test user created (ID: ${user.user_id})\n`);
    } else {
      console.log(`✅ Test user already exists (ID: ${user.user_id})\n`);
    }

    // Assign ADMIN role
    const [roleRows] = await db.sequelize.query(
      'SELECT role_id FROM roles WHERE UPPER(name) = "ADMIN" LIMIT 1'
    );
    
    let roleId = roleRows && roleRows[0] ? roleRows[0].role_id : null;
    
    if (!roleId) {
      console.log('Creating ADMIN role...');
      const [maxRoleRows] = await db.sequelize.query('SELECT COALESCE(MAX(role_id), 0) AS maxId FROM roles');
      roleId = (maxRoleRows[0]?.maxId ?? 0) + 1;
      
      await db.sequelize.query(
        'INSERT INTO roles (role_id, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        { replacements: [roleId, 'ADMIN', 'Administrator role'] }
      );
    }

    // Check if user already has role
    const [existingRole] = await db.sequelize.query(
      'SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1',
      { replacements: [user.user_id, roleId] }
    );

    if (!existingRole || !existingRole[0]) {
      await db.sequelize.query(
        'INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())',
        { replacements: [user.user_id, roleId] }
      );
      console.log('✅ ADMIN role assigned\n');
    } else {
      console.log('✅ ADMIN role already assigned\n');
    }

    // Generate auth token
    console.log('Generating auth token...');
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [maxTokenRows] = await db.sequelize.query('SELECT COALESCE(MAX(auth_token_id), 0) AS maxId FROM auth_tokens');
    const tokenId = (maxTokenRows[0]?.maxId ?? 0) + 1;

    await AuthToken.create({
      auth_token_id: tokenId,
      user_id: user.user_id,
      token_hash: token,
      token_type: 'bearer',
      expires_at: expiresAt,
      revoked_at: null,
    });

    console.log('✅ Auth token generated\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('TEST USER & TOKEN CREATED');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`Email:       test@example.com`);
    console.log(`User ID:     ${user.user_id}`);
    console.log(`Role:        ADMIN`);
    console.log(`Token:       ${token}`);
    console.log(`Expires:     ${expiresAt.toISOString()}\n`);
    console.log('Use this token in your API requests:');
    console.log(`Authorization: Bearer ${token}\n`);
    console.log('Example cURL:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/users\n`);
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createTestUser();
