import classNames from 'classnames';
import React from 'react';

interface Props {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<Props> = ({
  type = 'submit',
  variant = 'primary',
  size = 'md',
  children,
  className,
  onClick,
  disabled,
}) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
  };

  const sizeClass = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-3 px-7 text-sm',
    lg: 'py-4 px-8 text-base',
  };

  return (
    <button
      type={type}
      className={classNames(
        variantClass[variant],
        sizeClass[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
