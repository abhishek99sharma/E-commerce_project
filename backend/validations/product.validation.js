import { z } from "zod";

export const createProductSchema = z.object({
	body: z.object({
		name: z.string().min(2),
		description: z.string().min(5),
		price: z.coerce.number().positive(),
		image: z.string().url(),
		category: z.string().min(1),
		isFeatured: z.boolean().optional(),
	}),
	params: z.object({}),
	query: z.object({}),
});

export const productIdSchema = z.object({
	body: z.object({}),
	params: z.object({
		id: z.string().min(1),
	}),
	query: z.object({}),
});

export const categorySchema = z.object({
	body: z.object({}),
	params: z.object({
		category: z.string().min(1),
	}),
	query: z.object({}),
});

export const activitySchema = z.object({
	body: z.object({
		productId: z.string().min(1),
		type: z.enum(["view", "cart", "purchase"]),
	}),
	params: z.object({}),
	query: z.object({}),
});