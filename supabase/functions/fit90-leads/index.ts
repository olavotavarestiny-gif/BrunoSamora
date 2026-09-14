import { handleLead } from './handler.ts';

// JWT verification is enforced by the Supabase gateway (see config.toml).
Deno.serve((request: Request) => handleLead(request, {
  url: Deno.env.get('SUPABASE_URL') ?? '',
  serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
}));
