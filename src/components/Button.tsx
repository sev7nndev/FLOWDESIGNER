import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

const variantStyles = {
    primary: "bg-primary text-zinc-900 hover:bg-primary/90 shadow-lg shadow-primary/20",
    secondary: "bg-zinc-700 text-white hover:bg-zinc-600 border border-zinc-600",
    ghost: "bg-transparent text-primary hover:bg-primary/10",
    danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizeStyles = {
    small: "px-3 py-1.5 text-sm gap-1",
    medium: "px-4 py-2 text-base gap-2",
    large: "px-6 py-3 text-lg gap-2",
};

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    icon,
    className = '',
    ...props
}) => {
    const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
        <button className={styles} disabled={isLoading || props.disabled} {...props}>
            {isLoading ? (
                <Loader2 size={size === 'small' ? 16 : 20} className="animate-spin" />
            ) : (
                <>
                    {icon}
                    {children}
                </>
            )}
        </button>
    );
};