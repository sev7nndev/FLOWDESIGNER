import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    // Add custom props if needed later
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        const baseStyles = "w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150";
        
        return (
            <input
                type={type}
                className={`${baseStyles} ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';