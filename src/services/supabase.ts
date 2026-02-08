/**
 * SUPABASE SERVICE
 * =================
 *
 * Client-side Supabase integration for sharing and browsing levels.
 * Uses the anon key with RLS policies (public read + public insert).
 *
 * Table: levels (id, player_name, level_name, scene_data, image_path, score, created_at)
 * Storage bucket: level-images (public)
 */

import { createClient } from '@supabase/supabase-js';
import type { SceneV1 } from '../shared/schema/scene_v1.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — sharing disabled');
}

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SharedLevel {
    id: string;
    player_name: string;
    level_name: string;
    score: number;
    created_at: string;
}

export interface SharedLevelFull extends SharedLevel {
    scene_data: SceneV1;
    image_url: string;
}

// ---------------------------------------------------------------------------
// Share a level
// ---------------------------------------------------------------------------

export async function shareLevel(
    playerName: string,
    levelName: string,
    sceneData: SceneV1,
    imageBlob: Blob,
    score: number,
): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');

    // 1. Upload image to Storage
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: uploadError } = await supabase.storage
        .from('level-images')
        .upload(filename, imageBlob, {
            contentType: imageBlob.type || 'image/jpeg',
            upsert: false,
        });

    if (uploadError) {
        console.error('[Supabase] Image upload failed:', uploadError);
        throw new Error('Failed to upload image');
    }

    // 2. Insert level row
    const { data, error: insertError } = await supabase
        .from('levels')
        .insert({
            player_name: playerName.trim().slice(0, 30),
            level_name: levelName.trim().slice(0, 40),
            scene_data: sceneData,
            image_path: filename,
            score,
        })
        .select('id')
        .single();

    if (insertError || !data) {
        console.error('[Supabase] Insert failed:', insertError);
        throw new Error('Failed to save level');
    }

    return data.id;
}

// ---------------------------------------------------------------------------
// Browse levels
// ---------------------------------------------------------------------------

export async function fetchLevels(search?: string): Promise<SharedLevel[]> {
    if (!supabase) return [];

    let query = supabase
        .from('levels')
        .select('id, player_name, level_name, score, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

    if (search && search.trim()) {
        query = query.or(
            `level_name.ilike.%${search.trim()}%,player_name.ilike.%${search.trim()}%`
        );
    }

    const { data, error } = await query;

    if (error) {
        console.error('[Supabase] Fetch levels failed:', error);
        return [];
    }

    return data ?? [];
}

// ---------------------------------------------------------------------------
// Fetch a single level (full data + image URL)
// ---------------------------------------------------------------------------

export async function fetchLevel(id: string): Promise<SharedLevelFull | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('[Supabase] Fetch level failed:', error);
        return null;
    }

    // Build public image URL
    const { data: urlData } = supabase.storage
        .from('level-images')
        .getPublicUrl(data.image_path);

    return {
        id: data.id,
        player_name: data.player_name,
        level_name: data.level_name,
        score: data.score,
        created_at: data.created_at,
        scene_data: data.scene_data as SceneV1,
        image_url: urlData.publicUrl,
    };
}

// ---------------------------------------------------------------------------
// Check if Supabase is configured
// ---------------------------------------------------------------------------

export function isSupabaseConfigured(): boolean {
    return supabase !== null;
}
