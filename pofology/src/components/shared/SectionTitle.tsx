import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children, className = '' }) => {
  return (
    <div className={`text-center mb-8 ${className}`}>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
        {children}
      </h2>
    </div>
  );
};

export default SectionTitle;
