import express from "express";
import { signup, login, logout,refreshToken,getProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { signupSchema, loginSchema } from "../validations/auth.validation.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh-token",refreshToken);
router.get("/profile",protectRoute,getProfile);

export default router;