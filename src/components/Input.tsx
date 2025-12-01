import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, id, className = '', ...props }) => {
    const inputClasses = `w-full px-4 py-2 bg-zinc-800 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 ${
        error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-zinc-700'
    } ${className}`;

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={inputClasses}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-400">{error}</p>
            )}
        </div>
    );
};