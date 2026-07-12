import express from "express";

const router = express.Router();

router.post("/",protectRoute,addToCart);
router.get("/",protectRoute,getCartProducts);
router.delete("/",protectRoute,removeFromCart);
router.put("/:id",protectRoute,updateQuantity);

export default router;