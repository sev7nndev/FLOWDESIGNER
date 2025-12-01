import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: React.ReactNode;
    isLoading?: boolean;
    children: React.ReactNode;
}

const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-primary text-zinc-950 hover:bg-primary/80 shadow-lg shadow-primary/20",
    secondary: "bg-zinc-700 text-white hover:bg-zinc-600 border border-zinc-600",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800",
};

const sizeStyles: Record<ButtonSize, string> = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
};

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'medium',
    icon,
    isLoading = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
        <button
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
            ) : (
                <>
                    {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};