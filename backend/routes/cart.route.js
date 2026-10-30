import express from "express";
import {
	addToCart,
	getCartProducts,
	removeFromCart,
	updateQuantity,
} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
	addToCartSchema,
	removeCartSchema,
	updateCartSchema,
} from "../validations/cart.validation.js";

const router = express.Router();

router.post("/", protectRoute, validate(addToCartSchema), addToCart);
router.get("/", protectRoute, getCartProducts);
router.delete("/", protectRoute, validate(removeCartSchema), removeFromCart);
router.put("/:id", protectRoute, validate(updateCartSchema), updateQuantity);

export default router;