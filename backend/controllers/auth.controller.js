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
        maxAge: Number(process.env.ACCESS_TOKEN_COOKIE_EXPIRES_MS), //15 minutes
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,  //prevent xss attacks
        secure: process.env.NODE_ENV === "production", //only send cookie over https
        sameSite: "strict", //prevent csrf attacks
        maxAge: Number(process.env.REFRESH_TOKEN_COOKIE_EXPIRES_MS), //7 days
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
    try{
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select("+password");
        if(user && await user.comparePassword(password)){
            const {accessToken, refreshToken} = generateToken(user._id);
            await storeRefreshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);
            res.status(200).json({ user:{
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },message: "User logged in successfully" });
        }
        else{
            res.status(401).json({ message: "Invalid email or password" });
        }
    }catch(error){
        console.log("error in login controller",error.message);
        res.status(500).json({ message: "Error logging in user", error: error.message });
    }
};
export const logout = async (req, res) => {
    try{
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken){
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const userId = decoded.userId;
            await redis.del(`refresh_token:${userId}`);
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "User logged out successfully" });
    }catch(error){
        res.status(500).json({ message: "Error logging out user", error: error.message });
    }
};

export const refreshToken = async (req,res) =>{
    try{
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({ message: "No refresh token provided" });
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const userId = decoded.userId;
        const storedRefreshToken = await redis.get(`refresh_token:${userId}`);
        if(!storedRefreshToken || storedRefreshToken !== refreshToken){
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: Number(process.env.ACCESS_TOKEN_COOKIE_EXPIRES_MS),
        });
        res.status(200).json({ message: "Token refreshed successfully" });
    }catch(error){
        res.status(500).json({ message: "Error refreshing token", error: error.message });
    }
}

// export const getProfile = async (req,res) =>{
//     try{
//         const userId = req.userId;
//         const user = await User.findById(userId).select("-password");
//         if(!user){
//             return res.status(404).json({ message: "User not found" });
//         }
//         res.status(200).json({ user });
//     }catch(error){
//         res.status(500).json({ message: "Error fetching profile", error: error.message });
//     }
// }