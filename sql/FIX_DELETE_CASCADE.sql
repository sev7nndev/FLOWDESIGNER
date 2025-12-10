
-- Corrigir Constraint de Upload para permitir deleção de usuário
-- Primeiro removemos a FK antiga (nome pode variar, então tentamos pelo padrão do supabase ou genérico)
DO $$
BEGIN
  -- Tentar descobrir o nome da constraint se possível, ou dropar blind
  -- Geralmente: landing_carousel_images_uploaded_by_fkey
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'landing_carousel_images_uploaded_by_fkey') THEN
      ALTER TABLE public.landing_carousel_images DROP CONSTRAINT landing_carousel_images_uploaded_by_fkey;
  END IF;
END $$;

-- Recriar com SET NULL
ALTER TABLE public.landing_carousel_images 
ADD CONSTRAINT landing_carousel_images_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Aproveitar e checar outras tabelas sensíveis que podem não ter cascade no Schema original
-- (Payments, Images e Usage JÁ TÊM Cascade no Schema, então estamos seguros lá)
