import classNames from 'classnames';
import React from 'react';

interface Props {
  type?: 'button' | 'submit';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<Props> = ({ type = 'submit', children, className, onClick }) => {
  return (
    <button type={type} className={classNames(['btn', className])} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
