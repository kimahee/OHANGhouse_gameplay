import {village} from '../server/village.mjs';
import {bucket,unavailable} from '../server/supabase.mjs';
export default {async fetch(request) {
  try {return await village(request,bucket);} catch {return unavailable();}
}};
