import { supabase } from './supabase';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface ModerationResult {
  status: ModerationStatus;
  confidence: number;
  flags: string[];
  requiresHumanReview: boolean;
}

export interface ModerationProvider {
  analyzeImage(imageUrl: string): Promise<ModerationResult>;
}

class BasicModerationProvider implements ModerationProvider {
  async analyzeImage(imageUrl: string): Promise<ModerationResult> {
    const flags: string[] = [];

    const validDomains = [
      'supabase.co',
      'unsplash.com',
      'images.unsplash.com',
    ];

    try {
      const url = new URL(imageUrl);
      const isValidDomain = validDomains.some(d => url.hostname.includes(d));

      if (!isValidDomain) {
        flags.push('unrecognized_source');
      }
    } catch {
      flags.push('invalid_url');
      return { status: 'rejected', confidence: 1.0, flags, requiresHumanReview: false };
    }

    if (flags.length === 0) {
      return { status: 'approved', confidence: 0.7, flags: [], requiresHumanReview: false };
    }

    return {
      status: 'flagged',
      confidence: 0.5,
      flags,
      requiresHumanReview: true,
    };
  }
}

class GoogleVisionProvider implements ModerationProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeImage(imageUrl: string): Promise<ModerationResult> {
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`;

    const requestBody = {
      requests: [{
        image: { source: { imageUri: imageUrl } },
        features: [{ type: 'SAFE_SEARCH_DETECTION' }],
      }],
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      const safeSearch = data.responses?.[0]?.safeSearchAnnotation;

      if (!safeSearch) {
        return { status: 'flagged', confidence: 0.3, flags: ['api_no_response'], requiresHumanReview: true };
      }

      const flags: string[] = [];
      const HIGH_RISK = ['LIKELY', 'VERY_LIKELY'];

      if (HIGH_RISK.includes(safeSearch.adult)) flags.push('adult_content');
      if (HIGH_RISK.includes(safeSearch.violence)) flags.push('violence');
      if (HIGH_RISK.includes(safeSearch.racy)) flags.push('racy_content');

      if (flags.length > 0) {
        return { status: 'rejected', confidence: 0.9, flags, requiresHumanReview: flags.includes('racy_content') };
      }

      return { status: 'approved', confidence: 0.95, flags: [], requiresHumanReview: false };
    } catch {
      return { status: 'flagged', confidence: 0.3, flags: ['api_error'], requiresHumanReview: true };
    }
  }
}

let provider: ModerationProvider = new BasicModerationProvider();

export function setModerationProvider(p: ModerationProvider) {
  provider = p;
}

export function initGoogleVisionModeration(apiKey: string) {
  provider = new GoogleVisionProvider(apiKey);
}

export async function moderatePhoto(
  userId: string,
  photoId: string,
  imageUrl: string
): Promise<ModerationResult> {
  // Local analysis is used only for immediate UX feedback. The authoritative
  // moderation verdict is written server-side by the `moderate-photo` Edge
  // Function (triggered on photos INSERT): photo_moderation is now
  // service-role-write-only (see supabase/migrations/0001_p0a_rls_hardening.sql,
  // finding L-6), so the client must not upsert the verdict itself.
  const result = await provider.analyzeImage(imageUrl);

  // A locally-obvious rejection can still be cleaned up by the owner (photos
  // DELETE remains permitted for one's own rows); the server-side function is
  // the source of truth for anything the local heuristic can't judge.
  if (result.status === 'rejected') {
    await supabase.from('photos').delete().eq('id', photoId);
  }

  return result;
}

export async function getPhotoModerationStatus(photoId: string): Promise<ModerationStatus | null> {
  const { data } = await supabase
    .from('photo_moderation')
    .select('status')
    .eq('photo_id', photoId)
    .single();

  return data?.status || null;
}

export async function getPendingModerationQueue(): Promise<any[]> {
  const { data } = await supabase
    .from('photo_moderation')
    .select('*, photos(storage_path), profiles(display_name)')
    .eq('requires_human_review', true)
    .is('reviewed_at', null)
    .order('created_at', { ascending: true });

  return data || [];
}
