
import React, { useState, useEffect, useRef } from 'react';
import { PLACEHOLDER_EXAMPLES } from './constants';
import { GeneratedImage, GenerationState, GenerationStatus, BusinessInfo, User } from './types';
import { api } from './services/api';
import { getSupabase } from './services/supabaseClient';
import { Button } from './components/Button';
import { ImageResult } from './components/ImageResult';
import { LampHeader } from './components/Lamp';
import { LandingPage } from './components/LandingPage';
import { AuthScreens } from './components/AuthScreens';
import { GalleryModal } from './components/Modals';
import { Wand2, Sparkles, MapPin, Phone, Building2, Upload, Layers, CheckCircle2, History, LogOut } from 'lucide-react';

// Componente Input fora do App para performance
const InputField = ({ label, value, field, placeholder, icon, onChange }: any) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors flex items-center gap-1.5">
      {icon} {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      placeholder={placeholder}
      className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:bg-zinc-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none backdrop-blur-sm"
    />
  </div>
);

export const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'LANDING' | 'AUTH' | 'APP'>('LANDING');
  
  // Form State
  const [form, setForm] = useState<BusinessInfo>({
    companyName: '', phone: '', addressStreet: '', addressNumber: '',
    addressNeighborhood: '', addressCity: '', details: '', logo: ''
  });

  // Generation State
  const [state, setState] = useState<GenerationState>({
    status: GenerationStatus.IDLE,
    currentImage: null,
    history: [],
  });

  const [showGallery, setShowGallery] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Init
  useEffect(() => {
    const supabase = getSupabase();
    if (supabase) {
      // Check Session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleUserSession(session.user);
        }
      });

      // Listen for Auth Changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          handleUserSession(session.user);
        } else {
          setUser(null);
          setView('LANDING');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleUserSession = async (supabaseUser: any) => {
    const newUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || 'Usuário',
      role: 'client',
      createdAt: Date.now()
    };
    setUser(newUser);
    setView('APP');
    
    // Load History
    const history = await api.getHistory();
    setState(prev => ({ ...prev, history }));
  };

  const handleGenerate = async () => {
    if (!form.companyName || !form.details) return;

    setState(prev => ({ ...prev, status: GenerationStatus.GENERATING, error: undefined }));

    try {
      // CHAMA O SERVIÇO SEGURO (Que fala com o Backend)
      const newImage = await api.generate(form);
      
      setState(prev => ({
        status: GenerationStatus.SUCCESS,
        currentImage: newImage,
        history: [newImage, ...prev.history]
      }));

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, status: GenerationStatus.ERROR, error: "Erro ao gerar arte. Verifique se o Backend está rodando." }));
    }
  };

  const handleInputChange = (field: keyof BusinessInfo, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, logo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `flow-${image.id.slice(0,4)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setView('LANDING');
  };

  // --- RENDER VIEWS ---

  if (view === 'LANDING') {
    return <LandingPage onGetStarted={() => setView('AUTH')} onLogin={() => setView('AUTH')} />;
  }

  if (view === 'AUTH') {
    return <AuthScreens onSuccess={() => {}} onBack={() => setView('LANDING')} />;
  }

  // MAIN APP UI (Protected)
  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-primary/30 overflow-x-hidden relative">
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0" />
      
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
              <Sparkles size={16} className="text-primary" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white/90">Flow<span className="text-primary">Designer</span></span>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setShowGallery(true)} className="p-2 text-gray-400 hover:text-white transition-colors" title="Galeria">
              <History size={18} />
            </button>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <button onClick={handleLogout} className="text-xs font-medium text-gray-400 hover:text-red-400 flex items-center gap-2">
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-8 md:-mt-10">
        <LampHeader />
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-6 pb-24 relative z-20 mt-4 md:-mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              
              <div className="relative space-y-6 mb-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">Identidade Visual</h3>
                      <p className="text-xs text-gray-500">Dados principais do negócio</p>
                    </div>
                  </div>
                  <button onClick={() => setForm(PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)])} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                    <Wand2 size={12} /> Exemplo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Nome da Empresa" value={form.companyName} field="companyName" placeholder="Ex: Calors Automóveis" onChange={handleInputChange} />
                   <div className="space-y-1.5 group">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Upload size={10} /> Logotipo (Opcional)
                    </label>
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className={`w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-sm cursor-pointer transition-all flex items-center justify-between hover:bg-zinc-800 hover:border-white/20 ${form.logo ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-gray-500'}`}>
                        <span className="truncate">{form.logo ? 'Logo Carregada' : 'Enviar Imagem'}</span>
                        {form.logo ? <CheckCircle2 size={16} /> : <Upload size={16} />}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                   <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base">Endereço & Contato</h3>
                    <p className="text-xs text-gray-500">Para o cliente te encontrar</p>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-8">
                    <InputField label="Rua / Avenida" value={form.addressStreet} field="addressStreet" placeholder="Rua Silenciosa" onChange={handleInputChange} />
                  </div>
                  <div className="col-span-4 md:col-span-4">
                    <InputField label="Número" value={form.addressNumber} field="addressNumber" placeholder="278" onChange={handleInputChange} />
                  </div>
                  <div className="col-span-8 md:col-span-6">
                    <InputField label="Bairro" value={form.addressNeighborhood} field="addressNeighborhood" placeholder="São José" onChange={handleInputChange} />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField label="Cidade" value={form.addressCity} field="addressCity" placeholder="Rio de Janeiro" onChange={handleInputChange} />
                  </div>
                  <div className="col-span-12">
                    <InputField label="WhatsApp / Telefone" value={form.phone} field="phone" placeholder="(21) 99999-9999" icon={<Phone size={10} />} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-gradient-to-b from-zinc-800/60 to-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl flex-grow flex flex-col group hover:border-primary/30 transition-colors">
              <div className="p-6 flex flex-col h-full bg-black/20 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white">
                    <Layers size={18} className="text-accent" />
                    <h3 className="font-semibold">O Pedido (Briefing)</h3>
                  </div>
                </div>
                <textarea
                  value={form.details}
                  onChange={(e) => handleInputChange('details', e.target.value)}
                  placeholder="Descreva aqui o serviço... Ex: Oficina especializada em importados. Promoção de troca de óleo. Cores escuras e neon."
                  className="w-full flex-grow min-h-[180px] bg-transparent border-0 text-white placeholder-gray-500 focus:ring-0 transition-all outline-none resize-none text-sm leading-relaxed"
                />
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest">A I.A. vai ler isso</p>
                   <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{form.details.length} caracteres</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                  onClick={handleGenerate} 
                  isLoading={state.status === GenerationStatus.THINKING || state.status === GenerationStatus.GENERATING}
                  className="w-full h-16 text-lg font-bold tracking-wide rounded-xl shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] bg-gradient-to-r from-primary via-purple-600 to-secondary hover:brightness-110 active:scale-[0.98] transition-all border border-white/20 relative overflow-hidden group"
                  disabled={!form.companyName || !form.details}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                  <span className="relative flex items-center justify-center gap-3">
                    {state.status === GenerationStatus.GENERATING ? 'Criando Design (Secure)...' : 
                     <> <Sparkles className="fill-white" /> GERAR ARTE FLOW </>}
                  </span>
              </Button>
              {state.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-fade-in">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <p>{state.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div ref={resultRef} className="mt-8">
          {state.currentImage && (
            <section className="animate-fade-in max-w-4xl mx-auto pt-10 border-t border-white/5">
              <div className="text-center mb-10">
                <span className="text-primary text-xs font-bold uppercase tracking-widest mb-2 block">Resultado Final</span>
                <h2 className="text-3xl font-bold text-white mb-2">Sua Arte Profissional</h2>
              </div>
              <ImageResult image={state.currentImage} onDownload={() => state.currentImage && downloadImage(state.currentImage)} />
            </section>
          )}
        </div>
      </main>

      {showGallery && <GalleryModal history={state.history} onClose={() => setShowGallery(false)} onDownload={downloadImage} />}
    </div>
  );
};
