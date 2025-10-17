import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface CardProps {
  image: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  link: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  image,
  title,
  description,
  category,
  tags,
  link,
  className = '',
}) => {
  return (
    <motion.div
      className={`card overflow-hidden h-full ${className}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={link} className="block h-full">
        <div className="relative">
          <img 
            src={image} 
            alt={title} 
            className="h-56 w-full object-cover transition-all duration-500 hover:scale-105"
          />
          {category && (
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
              {category}
            </div>
          )}
        </div>
        <div className="p-6">
          <h3 className="text-xl font-medium mb-2">{title}</h3>
          <p className="text-sm text-primary-600 mb-4 line-clamp-2">{description}</p>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index} 
                  className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};