
-- Garantir que a coluna uploaded_by exista (Adicionar se faltar)
ALTER TABLE public.landing_carousel_images 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

ALTER TABLE public.landing_carousel_images 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Garantir que policies estejam corretas
ALTER TABLE public.landing_carousel_images ENABLE ROW LEVEL SECURITY;

-- Leitura Pública
DROP POLICY IF EXISTS "Public view carousel" ON public.landing_carousel_images;
CREATE POLICY "Public view carousel" ON public.landing_carousel_images FOR SELECT USING (true);

-- Escrita: Apenas Admins/Owners
DROP POLICY IF EXISTS "Admins manage carousel" ON public.landing_carousel_images;
CREATE POLICY "Admins manage carousel" ON public.landing_carousel_images 
FOR ALL USING (
  public.get_my_role() IN ('owner', 'admin', 'dev')
);

-- Recarregar Cache de Schema (Supabase faz isso automaticamente ao rodar DDL, mas ajuda comentar)
COMMENT ON TABLE public.landing_carousel_images IS 'Cache Reloaded';
