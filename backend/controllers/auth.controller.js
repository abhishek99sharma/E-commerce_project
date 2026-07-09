import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES });
    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", process.env.REFRESH_TOKEN_EXPIRES_SECONDS); // Store for 7 days
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,  //prevent xss attacks
        secure: process.env.NODE_ENV === "production", //only send cookie over https
        sameSite: "strict", //prevent csrf attacks
        maxAge: process.env.ACCESS_TOKEN_COOKIE_EXPIRES_MS, //15 minutes
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,  //prevent xss attacks
        secure: process.env.NODE_ENV === "production", //only send cookie over https
        sameSite: "strict", //prevent csrf attacks
        maxAge: process.env.REFRESH_TOKEN_COOKIE_EXPIRES_MS, //7 days
    })
}

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const user = await User.create({ name, email: normalizedEmail, password });

        //authenticate user
        const {accessToken, refreshToken} = generateToken(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.status(201).json({ user:{
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
};
export const login = async (req, res) => {
    res.send("login route called");
};
export const logout = async (req, res) => {
    res.send("logout route called");
};