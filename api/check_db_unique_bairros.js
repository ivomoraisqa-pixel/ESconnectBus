import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://epsvzkvtnetjdgkovakk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3Z6a3Z0bmV0amRna292YWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjI0ODgsImV4cCI6MjEwMDU5ODQ4OH0.WqYUhfjPKCS-t114gAk8XVuoU9dwf2yS10G_OgFSMvo'
);

async function main() {
  const { data } = await supabase.from('bus_stops').select('bairro, address').not('bairro', 'is', null).limit(100);
  console.log(data.map(d => d.bairro).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10)); // print first 10 unique bairros
}
main();
