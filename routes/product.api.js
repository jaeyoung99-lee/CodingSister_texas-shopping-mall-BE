const express = require("express");
const authController = require("../controllers/auth.controller");
const productController = require("../controllers/productController");
const router = express.Router();

router.post(
  "/",
  authController.authenticate,
  authController.checkAdminPermission,
  productController.createProduct
);

module.exports = router;
