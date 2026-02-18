// // 'use strict';
// // const { Sequelize } = require('sequelize');
// // require('dotenv').config(); // load .env

// // // Create Sequelize instance
// // const sequelize = new Sequelize(
// //   process.env.DB_NAME,      // database name
// //   process.env.DB_USER,      // database user
// //   process.env.DB_PASSWORD,  // database password
// //   {
// //     host: process.env.DB_HOST || 'localhost',
// //     dialect: 'mysql',       // or 'postgres', etc.
// //     logging: false,         // optional
// //   }
// // );

// // module.exports = sequelize;  // ✅ export the instance
// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: 'mysql',
//     logging: false,
//   }
// );

// module.exports = sequelize;
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',   // must be a string
  },
  test: {
    username: 'root',
    password: null,
    database: 'survey_db',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
  },
};
