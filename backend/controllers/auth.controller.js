import User from "../models/user.model.js";

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const user = await User.create({ name, email, password });
        res.status(201).json({ message: "User registered successfully" });
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