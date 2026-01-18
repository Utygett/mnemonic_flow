import React from 'react';
import styles from './Button.module.css';
import { cn } from '../../lib/cn';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
};

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const variantClass = variant === 'primary' ? styles['btn--primary'] : styles['btn--secondary'];
  const sizeClass =
    size === 'small' ? styles['btn--small'] : size === 'large' ? styles['btn--large'] : styles['btn--medium'];
  const fullClass = fullWidth ? styles['btn--full'] : '';

  const classes = cn(styles.button, variantClass, sizeClass, fullClass, className);

  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
