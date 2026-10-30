import { z } from "zod";

export const addToCartSchema = z.object({
	body: z.object({
		productId: z.string().min(1),
	}),
	params: z.object({}),
	query: z.object({}),
});

export const updateCartSchema = z.object({
	body: z.object({
		quantity: z.number().int().min(1),
	}),
	params: z.object({
		id: z.string().min(1),
	}),
	query: z.object({}),
});

export const removeCartSchema = z.object({
	body: z.object({
		productId: z.string().min(1),
	}),
	params: z.object({}),
	query: z.object({}),
});