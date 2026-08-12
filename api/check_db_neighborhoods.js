import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://epsvzkvtnetjdgkovakk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3Z6a3Z0bmV0amRna292YWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjI0ODgsImV4cCI6MjEwMDU5ODQ4OH0.WqYUhfjPKCS-t114gAk8XVuoU9dwf2yS10G_OgFSMvo'
);

async function main() {
  const { data: b1 } = await supabase.from('bus_stops').select('id, name, address, bairro').ilike('bairro', '%Anchieta%');
  const { data: b2 } = await supabase.from('bus_stops').select('id, name, address, bairro').ilike('bairro', '%Laranjeiras%');
  const { data: b3 } = await supabase.from('bus_stops').select('id, name, address, bairro').ilike('bairro', '%Tropical%');

  console.log('José de Anchieta:', b1?.length || 0);
  console.log('Laranjeiras / Colina de Laranjeiras:', b2?.length || 0);
  console.log('Jardim Tropical:', b3?.length || 0);
}

main();
