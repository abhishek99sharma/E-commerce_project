import {redis} from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import UserActivity from "../models/userActivity.model.js";
import ai from "../lib/gemini.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({ products });
    }catch (error) {
        console.log("error in getAllProducts controller",error.message);
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
}

export const getFeaturedProducts = async (req, res) => {
    console.log("GET /api/products/featured called");
    try {
        let featuredProducts = await redis.get("featuredProducts");
        if(featuredProducts){
            featuredProducts = JSON.parse(featuredProducts);
            return res.status(200).json({ products: featuredProducts, source: "cache" });
        }
        //lean() method is used to get plain JavaScript objects instead of Mongoose documents, which can improve performance when you don't need the full functionality of Mongoose documents.
        featuredProducts = await Product.find({ isFeatured: true }).lean();
        if(!featuredProducts || featuredProducts.length === 0) {
            return res.status(404).json({ message: "No featured products found" });
        }
        await redis.set("featuredProducts", JSON.stringify(featuredProducts));
        res.status(200).json({ products: featuredProducts, source: "database" });
    } catch (error) {
        console.log("error in getFeaturedProducts controller", error.message);
        res.status(500).json({ message: "Error fetching featured products", error: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;
        let cloudinaryResponse = null;
        if(image){
          cloudinaryResponse = await cloudinary.uploader.upload(image, {
            folder: "products",
            use_filename: true,
            unique_filename: false,
            transformation: [
                {
                    width: 1000,
                    crop: "limit",
                    quality: "auto",
                    fetch_format: "auto",
                },
            ],
        });
        }
        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse ? cloudinaryResponse.secure_url : null,
            category
        });

        res.status(201).json({ message: "Product created successfully", product });
    }catch (error) {
        console.log("error in createProduct controller", error.message);
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({ message: "Product not found" });
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0]; //give the public id of the image 
            try {
            await cloudinary.uploader.destroy(`products/${publicId}`);
            console.log(`Image with public ID ${publicId} deleted from Cloudinary`);
            } catch (error) {
            console.error(`Error deleting image with public ID ${publicId} from Cloudinary:`, error);
            }
        }
        await Product.findByIdAndDelete(req.params.id);
         if (product.isFeatured) {
         await updateFeaturedProductsCache();
         }

        res.status(200).json({ message: "Product deleted successfully" });
    }catch (error) {
        console.log("error in deleteProduct controller", error.message);
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
}

export const trackProductActivity = async (req, res) => {
	try {
		const { productId, type } = req.body;

		if (!productId || !type) {
			return res.status(400).json({
				message: "Product ID and activity type are required",
			});
		}

		if (!["view", "cart", "purchase"].includes(type)) {
			return res.status(400).json({
				message: "Invalid activity type",
			});
		}

		const recentActivity = await UserActivity.findOne({
			user: req.user._id,
			product: productId,
			type,
			createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
		});

		if (!recentActivity) {
			await UserActivity.create({
				user: req.user._id,
				product: productId,
				type,
			});

			await redis.del(`recommendations:${req.user._id}`);
		}

		res.status(201).json({ success: true });
	} catch (error) {
		console.error("Error tracking product activity:", error.message);
		res.status(500).json({
			message: "Error tracking product activity",
		});
	}
};
export const getRecommendedProducts = async (req, res) => {
	try {
		const cacheKey = `recommendations:v2:${req.user._id}`;

		const cached = await redis.get(cacheKey);

		if (cached) {
			return res.status(200).json({
				products: JSON.parse(cached),
			});
		}

		const activities = await UserActivity.find({
			user: req.user._id,
		})
			.sort({ createdAt: -1 })
			.limit(30)
			.populate("product")
			.lean();

		const excludedIds = activities
			.filter(
				(activity) =>
					activity.product &&
					(activity.type === "cart" ||
						activity.type === "purchase")
			)
			.map((activity) => activity.product._id.toString());

		const products = await Product.find({
			_id: {
				$nin: excludedIds,
			},
		})
			.select(
				"_id name description price image category isFeatured"
			)
			.lean();

		console.log("Available products:", products.length);

		if (!products.length) {
			return res.status(200).json({
				products: [],
			});
		}

		if (!activities.length) {
			const recommendations = products.slice(0, 5);

			await redis.set(
				cacheKey,
				JSON.stringify(recommendations),
				"EX",
				3600
			);

			return res.status(200).json({
				products: recommendations,
			});
		}

		const userHistory = activities
			.filter((activity) => activity.product)
			.map((activity) => ({
				name: activity.product.name,
				category: activity.product.category,
				price: activity.product.price,
				type: activity.type,
			}));

		const availableProducts = products.map((product) => ({
			id: product._id.toString(),
			name: product.name,
			description: product.description,
			category: product.category,
			price: product.price,
		}));

		const prompt = `
You are an e-commerce recommendation engine.

User activity:
${JSON.stringify(userHistory)}

Available products:
${JSON.stringify(availableProducts)}

Recommend up to 5 products based on the user's behavior.

Rules:
- Only recommend products from Available products.
- Never recommend cart or purchased products.
- Purchase is stronger than cart.
- Cart is stronger than view.
- Consider category, name, description and price.
- Return only product IDs.

Return JSON:
{
  "productIds": ["id1", "id2", "id3"]
}
`;

		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: prompt,
			config: {
				responseMimeType: "application/json",
			},
		});

		console.log("Gemini:", response.text);

		const result = JSON.parse(response.text);

		const recommendedProducts = (result.productIds || [])
			.map((id) =>
				products.find(
					(product) => product._id.toString() === id
				)
			)
			.filter(Boolean)
			.slice(0, 5);

		const finalProducts =
			recommendedProducts.length > 0
				? recommendedProducts
				: products.slice(0, 5);

		await redis.set(
			cacheKey,
			JSON.stringify(finalProducts),
			"EX",
			3600
		);

		return res.status(200).json({
			products: finalProducts,
		});
	} catch (error) {
		console.error(
			"Recommendation error:",
			error.message
		);

		const products = await Product.find({})
			.select(
				"_id name description price image category isFeatured"
			)
			.limit(5)
			.lean();

		return res.status(200).json({
			products,
		});
	}
};
export const getProductsByCategory = async (req, res) => {
    try {
        const category = req.params.category;
        const products = await Product.find({ category });
        res.status(200).json({ products });
    } catch (error) {
        console.error("Error fetching products by category:", error);
        res.status(500).json({ message: "Error fetching products by category", error: error.message });
    }
};

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if(product){
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            updateFeaturedProductsCache();
            res.json(updatedProduct);
        }
        else{
            res.status(404).json({ message: "Product not found" });
        }
    }catch (error) {
        console.error("Error toggling featured product:", error);
        res.status(500).json({ message: "Error toggling featured product", error: error.message });
    }
}  

async function updateFeaturedProductsCache() {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set("featuredProducts", JSON.stringify(featuredProducts));
        console.log("Featured products cache updated");
    } catch (error) {
        console.error("Error updating featured products cache:", error);
    }
}