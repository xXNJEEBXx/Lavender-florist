import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  description: string;
  count: number;
  index?: number;
}

export default function CategoryCard({ id, name, icon, description, count, index = 0 }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        to={`/products?category=${id}`}
        className="group block"
      >
        <div className="relative bg-white rounded-2xl border border-border p-6 hover:shadow-xl hover:shadow-lavender-500/10 transition-all duration-500 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-lavender-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-rose-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative">
            {/* Icon */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lavender-100 to-rose-100 flex items-center justify-center text-3xl mb-4"
            >
              {icon}
            </motion.div>

            {/* Content */}
            <h3 className="text-lg font-bold text-text group-hover:text-lavender-600 transition-colors mb-1">
              {name}
            </h3>
            <p className="text-sm text-text-muted mb-3">{description}</p>
            <span className="text-xs font-semibold text-lavender-500 bg-lavender-50 px-3 py-1 rounded-full">
              {count} منتج
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
