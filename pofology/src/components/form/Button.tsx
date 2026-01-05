import classNames from 'classnames';
import React from 'react';

interface Props {
  type?: 'button' | 'submit';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<Props> = ({ type = 'submit', children, className, onClick, disabled }) => {
  return (
    <button type={type} className={classNames(['btn', className])} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
