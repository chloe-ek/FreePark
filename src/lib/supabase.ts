import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if ((!supabaseUrl || !supabaseAnonKey) && __DEV__) {
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set');
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseAnonKey ?? '');

// Typed RPC wrapper — centralises the `as never` suppression in one place
// so all callers get proper TypeScript generics.
export async function callRpc<Row>(
  fn: string,
  args: Record<string, unknown>,
): Promise<{ data: Row[] | null; error: { message: string } | null }> {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  return {
    data: data as Row[] | null,
    error: error as { message: string } | null,
  };
}
