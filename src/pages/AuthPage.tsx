import React, { useState } from 'react';
import { Button } from '../components/Button'; // Usando o componente Button customizado
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Chrome } from 'lucide-react';
import { getSupabase } from '../services/supabaseClient'; // Usando getSupabase
import { useToast } from '../components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const supabase = getSupabase();

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Could not sign in with Google.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setIsLoadingEmail(true);
    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (data.user) {
            // Fetch user role for immediate redirection
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();
                
            const role = profileData?.role;
            
            if (role === 'owner') {
                navigate('/owner-panel', { replace: true });
            } else if (role === 'dev') {
                navigate('/dev-panel', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }

        toast({
          title: 'Success',
          description: 'Logged in successfully!',
        });
        
      } else {
        // Sign Up
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({
          title: 'Check your email',
          description: 'A confirmation link has been sent to your email address.',
        });
      }
    } catch (error: any) {
      toast({
        title: isLogin ? 'Login Failed' : 'Sign Up Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to continue generating AI art.' : 'Sign up to start your free trial.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign-In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || isLoadingEmail}
            className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white"
            icon={<Chrome className="h-5 w-5" />}
          >
            {isSigningIn ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Continue with Google'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSigningIn || isLoadingEmail}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSigningIn || isLoadingEmail}
            />
            <Button type="submit" className="w-full" disabled={isSigningIn || isLoadingEmail}>
              {isLoadingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          {/* Toggle between Login and Sign Up */}
          <div className="text-center text-sm">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setIsLogin(false)} className="text-primary hover:underline">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setIsLogin(true)} className="text-primary hover:underline">
                  Sign In
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;