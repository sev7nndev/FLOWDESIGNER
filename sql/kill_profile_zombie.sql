-- MATANDO O ÚLTIMO ZUMBI!
-- O problema era este gatilho escondido na tabela PROFILES.
-- Ele tentava criar uma assinatura automaticamente usando um ID inválido.

DROP TRIGGER IF EXISTS on_profile_insert_subscription ON public.profiles CASCADE;

-- (Opcional) Se a função associada tiver outro nome, o comando CASCADE acima deve resolver,
-- mas vamos garantir tentando apagar pelo nome provável que vimos no erro anterior:
DROP FUNCTION IF EXISTS public.handle_new_user_subscription() CASCADE;

-- Agora, o cadastro deve fluir livremente!
