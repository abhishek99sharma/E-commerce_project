export const addToCart = (req, res) => {
    try{
        const{productId}= req.body;
        const user = req.user;

        const existingItem = user.cartItem.find(item => item.product.toString() === productId);
        if(existingItem){
            existingItem.quantity += 1;
        }else{
            user.cartItem.push({product: productId, quantity: 1});
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
            user.cartItem = [];
        }else{
            user.cartItem = user.cartItem.filter((item) => item.product.toString() !== productId);
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
        const existingItem = user.cartItem.find((item) => item.product.toString()===productId);

        if(existingItem){
            if(quantity===0){
                user.cartItem = user.cartItem.filter((item) => item.product.toString() !== productId);
                await user.save();
                return res.json(user.cartItem)
            }
            existingItem.quantity=quantity;
            await user.save();
            res.json(user.cartItem);
        }else{
            res.status(404).json({message: "product not found"});
        }
    }catch (error) {
        console.error("Error updating item quantity:", error);
        res.status(500).json({ message: "Error updating item quantity", error: error.message });
    }
};