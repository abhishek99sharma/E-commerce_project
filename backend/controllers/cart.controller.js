import Product from '../models/product.model.js'

export const getCartProducts = async (req, res) => {
    try {
        const productIds = req.user.cartItems.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds }});
        const cartItems = products.map(product => {
            const item = req.user.cartItems.find(cartItem =>
                cartItem.product.toString() === product._id.toString()
            );
            return {
                ...product.toJSON(),
                quantity: item.quantity
            };
        });
        res.status(200).json(cartItems);
    } catch (error) {
        console.error("Error in getCartProducts:", error.message);
        res.status(500).json({message: "Internal Server Error",error: error.message});
    }
};

export const addToCart = async (req, res) => {
    try{
        const{productId}= req.body;
        const user = req.user;

        const existingItem = user.cartItems.find(item => item.product.toString() === productId);
        if(existingItem){
            existingItem.quantity += 1;
        }else{
            user.cartItems.push({product: productId, quantity: 1});
        }
        await user.save();
        res.status(200).json({ message: "Item added to cart" });
    }catch (error) {
        console.error("Error adding item to cart:", error);
        res.status(500).json({ message: "Error adding item to cart", error: error.message });
    }
};

export const removeFromCart = async (req, res) => { 
    try{
        const { productId } = req.body;
        const user = req.user;
        if(!productId){
            return res.status(400).json({
                message: "Product ID is required"
            });
        }else{
            user.cartItems = user.cartItems.filter((item) => item.product.toString() !== productId);
        }
        await user.save();
        res.status(200).json({ message: "Item removed from cart" });
    }catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).json({ message: "Error removing item from cart", error: error.message });
    }
};

export const updateQuantity = async (req, res) => {
    try{
        const { id:productId } = req.params;
        const { quantity } = req.body;
        const user = req.user; 
        const existingItem = user.cartItems.find((item) => item.product.toString()===productId);

        if(existingItem){
            if(quantity===0){
                user.cartItems = user.cartItems.filter((item) => item.product.toString() !== productId);
                await user.save();
                return res.json(user.cartItems)
            }
            existingItem.quantity=quantity;
            await user.save();
            res.json(user.cartItems);
        }else{
            res.status(404).json({message: "product not found"});
        }
    }catch (error) {
        console.error("Error updating item quantity:", error);
        res.status(500).json({ message: "Error updating item quantity", error: error.message });
    }
};
