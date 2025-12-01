import React from 'react';
import { AuthScreens } from '../components/AuthScreens';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
    const navigate = useNavigate();
    
    // AuthScreens handles the actual login/register logic internally via authService.
    // onSuccess is called when a session is successfully established (or registration is complete).
    const handleAuthSuccess = (user: User | null) => {
        // If successful, navigate to the main app page.
        navigate('/app');
    };
    
    return (
        <AuthScreens 
            isLogin={true}
            onSuccess={handleAuthSuccess}
            onBack={() => navigate('/')}
        />
    );
};