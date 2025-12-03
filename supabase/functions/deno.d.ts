// Declarações de tipo para o ambiente Deno
declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

// Declarações de tipo para módulos remotos
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  import { SupabaseClient } from '@supabase/supabase-js';
  export * from '@supabase/supabase-js';
  export function createClient(supabaseUrl: string, supabaseKey: string): SupabaseClient;
}