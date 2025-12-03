import React, { useState, useEffect } from 'react';
import { getSupabase } from '../services/supabaseClient';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setStatus('loading');
    setMessage('Testando conexão com Supabase...');
    
    try {
      const supabase = getSupabase();
      
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado');
      }
      
      // Test 1: Verificar conexão básica
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role, status, first_name, last_name')
        .limit(10);
      
      if (profilesError) {
        throw new Error(`Erro na consulta de perfis: ${profilesError.message}`);
      }
      
      // Test 2: Verificar usuários na auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.warn('Não foi possível listar usuários (permissão admin necessária)');
      } else {
        setUsers(authUsers.users || []);
      }
      
      setProfiles(profilesData || []);
      setStatus('success');
      setMessage(`Conexão OK! ${profilesData?.length || 0} perfis e ${authUsers?.users?.length || 0} usuários`);
      
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
        password,
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

  const createTestUser = async () => {
    setStatus('loading');
    setMessage('Criando usuário de teste...');
    
    try {
      const supabase = getSupabase();
      
      // Criar usuário de teste
      const { data, error } = await supabase.auth.signUp({
        email: 'teste@flowdesigner.com',
        password: '123456',
        options: {
          data: {
            first_name: 'Teste',
            last_name: 'User'
          }
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          // Usuário já existe, tentar fazer login
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email: 'teste@flowdesigner.com',
            password: '123456'
          });
          
          if (loginData.user) {
            // Criar perfil
            await supabase
              .from('profiles')
              .upsert({
                id: loginData.user.id,
                role: 'free',
                status: 'on',
                first_name: 'Teste',
                last_name: 'User'
              });
            
            setStatus('success');
            setMessage('Usuário de teste criado/atualizado com sucesso!');
          }
        } else {
          throw new Error(error.message);
        }
      } else if (data.user) {
        // Criar perfil
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            role: 'free',
            status: 'on',
            first_name: 'Teste',
            last_name: 'User'
          });
        
        setStatus('success');
        setMessage('Usuário de teste criado com sucesso!');
      }
      
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Erro ao criar usuário');
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-zinc-900 border border-white/10 rounded-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold flex items-center gap-2">
          Teste Supabase
          {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
          {status === 'success' && <CheckCircle size={16} className="text-green-500" />}
          {status === 'error' && <XCircle size={16} className="text-red-500" />}
        </h3>
        <button 
          onClick={() => setShowTest(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <p className="text-xs text-gray-400 mb-3">{message}</p>
      
      <div className="space-y-2">
        <button
          onClick={testConnection}
          className="w-full px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/80 flex items-center gap-2"
        >
          <RefreshCw size={12} />
          Testar Conexão
        </button>
        
        <div className="space-y-1">
          <button
            onClick={() => testLogin('admin@flowdesigner.com', '123456')}
            className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Testar Admin
          </button>
          
          <button
            onClick={() => testLogin('dev@flowdesigner.com', '123456')}
            className="w-full px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            Testar Dev
          </button>
          
          <button
            onClick={() => testLogin('owner@flowdesigner.com', '123456')}
            className="w-full px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
          >
            Testar Owner
          </button>
        </div>
        
        <button
          onClick={createTestUser}
          className="w-full px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
        >
          Criar Usuário Teste
        </button>
      </div>
      
      {profiles.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-1">Perfis encontrados:</p>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {profiles.map((profile: any) => (
              <p key={profile.id} className="text-xs text-gray-300">
                {profile.first_name} {profile.last_name} ({profile.role})
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};