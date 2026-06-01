import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface OccasionCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  index?: number;
}

export default function OccasionCard({ id, name, icon, color, index = 0 }: OccasionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link
        to={`/products?occasion=${id}`}
        className="group block text-center"
      >
        <motion.div
          whileHover={{ y: -8 }}
          className={`
            w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-gradient-to-br ${color}
            flex items-center justify-center text-3xl sm:text-4xl
            shadow-lg group-hover:shadow-xl transition-all duration-300
            mb-3
          `}
        >
          {icon}
        </motion.div>
        <span className="text-sm font-semibold text-text group-hover:text-lavender-600 transition-colors">
          {name}
        </span>
      </Link>
    </motion.div>
  );
}
