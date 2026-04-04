require('dotenv').config();

const common = {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mero5712',
    database: process.env.DB_NAME || 'survey_db',
    host: process.env.DB_HOST || '10.150.20.138',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    migrations: '/var/www/Survey-Premium_Project_Backend/src/migrations',
    models: '/var/www/Survey-Premium_Project_Backend/src/models',
};

module.exports = {
    development: {
        ...common,
        database: process.env.DB_NAME || 'survey_db',
    },
    test: {
        ...common,
        database: process.env.DB_NAME_TEST || 'survey_db_test',
    },
    production: {
        ...common,
        database: process.env.DB_NAME_PROD || process.env.DB_NAME || 'survey_db',
    },
};