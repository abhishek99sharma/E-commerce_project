import { useEffect } from "react";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import FeaturedProducts from "../components/FeaturedProducts";

const categories = [
	{ href: "/jeans", name: "Jeans", imageUrl: "https://res.cloudinary.com/dmreadfec/image/upload/f_auto,q_auto,w_800/v1784487889/jeans_r2b8js.jpg" },
	{ href: "/t-shirts", name: "T-shirts", imageUrl: "https://res.cloudinary.com/dmreadfec/image/upload/f_auto,q_auto,w_800/v1784487877/tshirts_h3rp4i.jpg" },
	{ href: "/shoes", name: "Shoes", imageUrl: "https://res.cloudinary.com/dmreadfec/image/upload/f_auto,q_auto,w_800/v1784487889/my_shoe_ikrqqs.jpg" },
	{ href: "/glasses", name: "Glasses", imageUrl: "https://res.cloudinary.com/dmreadfec/image/upload/f_auto,q_auto,w_800/v1784487866/glasses_ersq21.jpg" },
	{ href: "/jackets", name: "Jackets", imageUrl: "https://res.cloudinary.com/dmreadfec/image/upload/f_auto,q_auto,w_800/v1784487873/jackets_iqmp1s.jpg" },
	{ href: "/suits", name: "Suits", imageUrl: "https://res.cloudinary.com/dmreadfec/image/upload/f_auto,q_auto,w_800/v1784487865/suits_e2onue.jpg" },
	{ href: "/bags", name: "Bags", imageUrl: "https://res.cloudinary.com/dmreadfec/image/upload/f_auto,q_auto,w_800/v1784487882/bags_zq2lcx.jpg" },
];

const HomePage = () => {
	const { fetchFeaturedProducts, products, loading } = useProductStore();

	useEffect(() => {
		fetchFeaturedProducts();
	}, [fetchFeaturedProducts]);

	return (
		<div className='relative min-h-screen text-white overflow-hidden'>
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<h1 className='text-center text-5xl sm:text-6xl font-bold text-emerald-400 mb-4'>
					Explore Our Categories
				</h1>
				<p className='text-center text-xl text-gray-300 mb-12'>
					Discover the latest trends 
				</p>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{categories.map((category) => (
						<CategoryItem category={category} key={category.name} />
					))}
				</div>

				{!loading && products.length > 0 && <FeaturedProducts featuredProducts={products} />}
			</div>
		</div>
	);
};
export default HomePage;