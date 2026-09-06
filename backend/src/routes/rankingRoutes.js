const express = require("express");
const rankingController = require("../controllers/rankingController");

const { optionalAuthenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/", optionalAuthenticate, rankingController.getRanking);

module.exports = router;
