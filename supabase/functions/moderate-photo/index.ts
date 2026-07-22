import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { record } = await req.json();
  const { id: photoId, user_id, storage_path } = record;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const googleApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');

  let status = 'approved';
  let confidence = 0.7;
  let flags: string[] = [];
  let requiresReview = false;

  if (googleApiKey) {
    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { source: { imageUri: storage_path } },
              features: [{ type: 'SAFE_SEARCH_DETECTION' }],
            }],
          }),
        }
      );

      const data = await response.json();
      const safeSearch = data.responses?.[0]?.safeSearchAnnotation;

      if (safeSearch) {
        const HIGH = ['LIKELY', 'VERY_LIKELY'];
        if (HIGH.includes(safeSearch.adult)) { flags.push('adult'); status = 'rejected'; }
        if (HIGH.includes(safeSearch.violence)) { flags.push('violence'); status = 'rejected'; }
        if (HIGH.includes(safeSearch.racy)) { flags.push('racy'); requiresReview = true; status = 'flagged'; }
        confidence = 0.9;
      }
    } catch {
      requiresReview = true;
      status = 'flagged';
    }
  }

  await supabase.from('photo_moderation').upsert({
    photo_id: photoId,
    user_id,
    status,
    confidence,
    flags,
    requires_human_review: requiresReview,
    reviewed_at: status === 'approved' ? new Date().toISOString() : null,
  });

  if (status === 'rejected') {
    await supabase.from('photos').delete().eq('id', photoId);
  }

  return new Response(JSON.stringify({ status, flags }), { status: 200 });
});
