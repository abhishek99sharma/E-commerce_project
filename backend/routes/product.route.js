import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getFeaturedProducts,
	getRecommendedProducts,
	getProductsByCategory,
	toggleFeaturedProduct,
	trackProductActivity,
} from "../controllers/product.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
	createProductSchema,
	productIdSchema,
	categorySchema,
	activitySchema,
} from "../validations/product.validation.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);

router.get("/featured", getFeaturedProducts);

router.get("/recommended", protectRoute, getRecommendedProducts);

router.get(
	"/category/:category",
	validate(categorySchema),
	getProductsByCategory
);

router.post(
	"/",
	protectRoute,
	adminRoute,
	validate(createProductSchema),
	createProduct
);

router.patch(
	"/:id",
	protectRoute,
	adminRoute,
	validate(productIdSchema),
	toggleFeaturedProduct
);

router.delete(
	"/:id",
	protectRoute,
	adminRoute,
	validate(productIdSchema),
	deleteProduct
);

router.post(
	"/activity",
	protectRoute,
	validate(activitySchema),
	trackProductActivity
);

export default router;