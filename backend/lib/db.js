import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.mongodb_url);
        console.log(`Connected to MongoDB : ${conn.connection.host}`);
    }catch (error) {
        console.log("Error in connecting to database", error.message);
        process.exit(1);
    }
}

       