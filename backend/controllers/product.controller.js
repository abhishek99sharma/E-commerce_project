import Product from "../models/product.model.js";

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