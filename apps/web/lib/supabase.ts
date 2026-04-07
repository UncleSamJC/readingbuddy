import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ubfxqldkfxnenlfvtsma.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_acvPS5YSqQ3fVIFaalTFcA_Al110L9_";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
