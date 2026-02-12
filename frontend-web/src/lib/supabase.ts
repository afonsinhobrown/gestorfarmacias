import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (Client-side)
// Estas variáveis devem estar no .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yluxubudoxkpmsznkbja.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

// Cliente Singleton
export const supabase = createClient(supabaseUrl, supabaseKey);

// Utilitário para upload de arquivos
export const uploadFile = async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

    if (error) {
        throw error;
    }

    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};
