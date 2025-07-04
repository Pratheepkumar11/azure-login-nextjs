import React from 'react';

interface CustomLoaderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  color?: string;
}

export const CustomLoader: React.FC<CustomLoaderProps> = ({ 
  size = 'medium', 
  className = '',
  color = 'blue' 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          border-4 
          ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}
          border-t-transparent 
          rounded-full 
          animate-spin
        `}
      />
    </div>
  );
};
