import React from 'react';
import { AuthScreens } from '../components/AuthScreens';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface RegisterPageProps {
    onRegister: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
}

export const RegisterPage: React.FC<RegisterPageProps> = () => {
    const navigate = useNavigate();
    
    // AuthScreens handles the actual login/register logic internally via authService.
    // onSuccess is called when a session is successfully established (or registration is complete).
    const handleAuthSuccess = (user: User | null) => {
        // After registration, AuthScreens shows a success message, so we don't navigate immediately.
        // If the user logs in after confirmation, the main App.tsx handles the redirect.
    };
    
    return (
        <AuthScreens 
            isLogin={false}
            onSuccess={handleAuthSuccess}
            onBack={() => navigate('/')}
        />
    );
};