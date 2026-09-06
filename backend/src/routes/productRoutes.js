const express = require("express");
const productController = require("../controllers/productController");

const { optionalAuthenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/search", productController.searchProducts);
router.get("/category/:categoryId", productController.getProductsByCategory);
router.get("/:id", optionalAuthenticate, productController.getProductById);

module.exports = router;
