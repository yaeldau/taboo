import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("SUPABASE_URL exists:", !!supabaseUrl);
console.log("SUPABASE_KEY exists:", !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getRoomChannel(roomId: string) {
  return supabase.channel(`room:${roomId}`);
}
