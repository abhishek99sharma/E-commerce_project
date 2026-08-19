import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},
		type: {
			type: String,
			enum: ["view", "cart", "purchase"],
			required: true,
		},
	},
	{ timestamps: true }
);

userActivitySchema.index({
	user: 1,
	product: 1,
	type: 1,
	createdAt: -1,
});

const UserActivity = mongoose.model("UserActivity", userActivitySchema);

export default UserActivity;