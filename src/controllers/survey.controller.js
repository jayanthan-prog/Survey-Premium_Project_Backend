const { Survey } = require("../models");

exports.createSurvey = async (req, res) => {
  try {
    const survey = await Survey.create(req.body);
    res.status(201).json(survey);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getSurveys = async (req, res) => {
  const surveys = await Survey.findAll();
  res.json(surveys);
};

exports.getSurveyById = async (req, res) => {
  const survey = await Survey.findByPk(req.params.id);
  if (!survey) return res.status(404).json({ message: "Survey not found" });
  res.json(survey);
};
