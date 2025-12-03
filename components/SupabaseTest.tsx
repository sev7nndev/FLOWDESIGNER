import React, { useState, useEffect } from 'react';
import { getSupabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setStatus('loading');
    setMessage('Testando conexão com Supabase...');
    
    try {
      const supabase = getSupabase();
      
      // Test 1: Verificar se o cliente foi inicializado
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado');
      }
      
      // Test 2: Verificar conexão básica
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, status')
        .limit(5);
      
      if (error) {
        throw new Error(`Erro na consulta: ${error.message}`);
      }
      
      // Test 3: Verificar usuários na auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.warn('Não foi possível listar usuários (permissão admin necessária)');
      } else {
        setUsers(authUsers.users || []);
      }
      
      setStatus('success');
      setMessage(`Conexão OK! Encontrados ${data?.length || 0} perfis e ${authUsers?.users?.length || 0} usuários`);
      
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Erro desconhecido');
      console.error('Supabase connection error:', error);
    }
  };

  const testLogin = async (email: string, password: string) => {
    setStatus('loading');
    setMessage(`Testando login com ${email}...`);
    
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw new Error(`Login falhou: ${error.message}`);
      }
      
      if (data.user) {
        setStatus('success');
        setMessage(`Login OK! Usuário: ${data.user.email}, ID: ${data.user.id}`);
        
        // Fazer logout após teste
        await supabase.auth.signOut();
      }
      
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Erro no login');
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-zinc-900 border border-white/10 rounded-lg p-4 max-w-sm">
      <h3 className="text-white font-bold mb-3 flex items-center gap-2">
        Teste Supabase
        {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
        {status === 'success' && <CheckCircle size={16} className="text-green-500" />}
        {status === 'error' && <XCircle size={16} className="text-red-500" />}
      </h3>
      
      <p className="text-xs text-gray-400 mb-3">{message}</p>
      
      <div className="space-y-2">
        <button
          onClick={testConnection}
          className="w-full px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/80"
        >
          Testar Conexão
        </button>
        
        <div className="space-y-1">
          <button
            onClick={() => testLogin('admin@flowdesigner.com', '123456')}
            className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Testar Login Admin
          </button>
          
          <button
            onClick={() => testLogin('dev@flowdesigner.com', '123456')}
            className="w-full px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            Testar Login Dev
          </button>
          
          <button
            onClick={() => testLogin('owner@flowdesigner.com', '123456')}
            className="w-full px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
          >
            Testar Login Owner
          </button>
        </div>
      </div>
      
      {users.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-1">Usuários encontrados:</p>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {users.map((user: any) => (
              <p key={user.id} className="text-xs text-gray-300">
                {user.email} ({user.user_metadata?.first_name || 'N/A'})
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};