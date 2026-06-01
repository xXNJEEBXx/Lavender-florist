import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useCart } from '../../store/CartContext';
import Badge from '../ui/Badge';

interface ProductCardProps {
  product: Product;
  index?: number;
}

// Generate a gradient based on product category
const categoryGradients: Record<string, string> = {
  bouquets: 'from-lavender-200 via-rose-100 to-lavender-100',
  boxes: 'from-rose-200 via-cream-100 to-lavender-100',
  arrangements: 'from-leaf-100 via-cream-100 to-lavender-100',
  singles: 'from-rose-100 via-pink-100 to-cream-100',
  gifts: 'from-amber-100 via-cream-100 to-rose-100',
};

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const gradient = categoryGradients[product.category] || categoryGradients.bouquets;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-2xl hover:shadow-lavender-500/10 transition-all duration-500">
        {/* Image Area */}
        <Link to={`/products/${product.slug}`} className="block relative overflow-hidden">
          <div className={`aspect-[4/5] bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
            {/* Decorative flower pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 right-4 text-6xl">🌸</div>
              <div className="absolute bottom-8 left-6 text-4xl">🌿</div>
              <div className="absolute top-1/2 left-1/3 text-3xl">✨</div>
            </div>
            <span className="text-7xl relative z-10 group-hover:scale-110 transition-transform duration-500">
              {product.category === 'bouquets' ? '💐' : 
               product.category === 'boxes' ? '🎁' :
               product.category === 'arrangements' ? '🌺' :
               product.category === 'singles' ? '🌹' : '🎀'}
            </span>

            {/* Out of stock overlay */}
            {!product.is_in_stock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white/90 text-text px-4 py-2 rounded-xl font-bold text-sm">
                  نفذت الكمية
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {product.discount_percentage && (
                <Badge variant="danger" size="sm">
                  خصم {product.discount_percentage}%
                </Badge>
              )}
              {product.is_featured && (
                <Badge variant="lavender" size="sm">
                  مميز
                </Badge>
              )}
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex items-center gap-2 justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors shadow-lg cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                </motion.button>
                <Link
                  to={`/products/${product.slug}`}
                  className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors shadow-lg"
                >
                  <Eye className="w-4 h-4 text-lavender-600" />
                </Link>
              </div>
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="p-4">
          <Link to={`/products/${product.slug}`}>
            <h3 className="font-bold text-text hover:text-lavender-600 transition-colors line-clamp-1 mb-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-text-muted line-clamp-1 mb-3">
            {product.short_description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-lavender-700">
                {product.price} ر.س
              </span>
              {product.compare_at_price && (
                <span className="text-sm text-text-muted line-through">
                  {product.compare_at_price} ر.س
                </span>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => product.is_in_stock && addItem(product)}
              disabled={!product.is_in_stock || isInCart(product.id)}
              className={`
                p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                ${
                  isInCart(product.id)
                    ? 'bg-leaf-500 text-white'
                    : product.is_in_stock
                    ? 'bg-lavender-500 text-white hover:bg-lavender-600 shadow-lg shadow-lavender-500/25'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <ShoppingBag className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
