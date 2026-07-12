import {redis} from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
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

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;
        let cloudinaryResponse = null;
        if(image){
            cloudinaryResponse = await cloudinary.uploader.upload(image, {
                folder: "products",
                use_filename: true,
                unique_filename: false
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
        await product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product deleted successfully" });
    }catch (error) {
        console.log("error in deleteProduct controller", error.message);
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
             $sample: { size: 5 }
            },
            {
             $project: {
                _id: 1,
                name: 1,
                description: 1, 
                price: 1, 
                image: 1, 
             }  
            }
        ]);
        res.status(200).json({ products });
    }catch (error) {
        console.error("Error fetching recommended products:", error);
        res.status(500).json({ message: "Error fetching recommended products", error: error.message });
    }
}

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