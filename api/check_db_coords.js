import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://epsvzkvtnetjdgkovakk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3Z6a3Z0bmV0amRna292YWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjI0ODgsImV4cCI6MjEwMDU5ODQ4OH0.WqYUhfjPKCS-t114gAk8XVuoU9dwf2yS10G_OgFSMvo'
);

async function main() {
  // Bounding box para José de Anchieta e Jardim Tropical
  const latMin = -20.210;
  const latMax = -20.170;
  const lonMin = -40.265;
  const lonMax = -40.235;

  const { data } = await supabase.from('bus_stops')
    .select('id, name, latitude, longitude')
    .gte('latitude', latMin)
    .lte('latitude', latMax)
    .gte('longitude', lonMin)
    .lte('longitude', lonMax);

  console.log(`Pontos encontrados na região (José Anchieta / Tropical / Laranjeiras): ${data?.length || 0}`);
}
main();
