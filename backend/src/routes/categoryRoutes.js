const express = require("express");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

router.get("/", categoryController.getCategories);
router.get("/:slug", categoryController.getCategoryBySlug);

module.exports = router;
