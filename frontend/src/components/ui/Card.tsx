import { type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'bg-white border border-border',
  elevated: 'bg-white shadow-xl shadow-lavender-500/5',
  outlined: 'bg-transparent border-2 border-lavender-200',
  glass: 'glass',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  variant = 'default',
  hover = true,
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px rgba(155, 124, 184, 0.12)' } : undefined}
      transition={{ duration: 0.3 }}
      className={`
        rounded-2xl overflow-hidden transition-all duration-300
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}
