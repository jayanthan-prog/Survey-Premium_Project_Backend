const express = require("express");
const router = express.Router();
const controller = require("../controllers/userRole.controller");

router.post("/", controller.assignRole);
router.get("/", controller.getAllRoles);
router.get("/:user_id", controller.getUserRoles);
router.delete("/", controller.removeRole);

module.exports = router;
