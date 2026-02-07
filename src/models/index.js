const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.SurveyQuestion = require('./survey_question')(sequelize, DataTypes);
db.SurveyQuestionOption = require('./survey_question_option')(sequelize, DataTypes);
db.SurveyRelease = require('./survey_release')(sequelize, DataTypes);
db.Survey = require("./survey")(sequelize, DataTypes);

// Associations
db.SurveyQuestion.hasMany(db.SurveyQuestionOption, {
  foreignKey: 'question_id'
});
db.SurveyQuestionOption.belongsTo(db.SurveyQuestion, {
  foreignKey: 'question_id'
});

module.exports = db;
