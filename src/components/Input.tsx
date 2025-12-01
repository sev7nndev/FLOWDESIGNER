import React from 'react';
import { cn } from '../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, ...props }) => {
    const inputClasses = cn(
        "w-full p-3 bg-zinc-800 border rounded-lg text-white focus:ring-primary focus:border-primary transition-colors",
        error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-zinc-700",
        className
    );

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={props.id || props.name} className="block text-sm font-medium text-zinc-300">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                        {icon}
                    </div>
                )}
                <input
                    className={cn(inputClasses, icon && "pl-10")}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-400 mt-1">{error}</p>
            )}
        </div>
    );
};