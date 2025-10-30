import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64 } = await req.json();
    
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image format
    if (!imageBase64.match(/^data:image\/(jpeg|jpg|png|webp);base64,/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Please upload JPEG, PNG, or WebP.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image size (base64 length / 1.37 ≈ original size)
    const estimatedSizeInBytes = (imageBase64.length * 3) / 4;
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    
    if (estimatedSizeInBytes > maxSizeInBytes) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('AI service configuration missing');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing image with OCR...');

    // Call Gemini AI for OCR
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the medicine names WITH their strength/quantity from this prescription or medicine package image. List each medicine name on a separate line. Include the full medicine name with strength (e.g., "Folic Acid BP 5mg", "Panadol (Paracetamol) 500mg"). Do NOT include dosage instructions like "three times daily", "14 days", or tablet counts like "x20". Only return medicine names with their strength, one per line.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('OCR service error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ error: 'Unable to process image. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || '';

    console.log('OCR completed, extracted text:', extractedText);

    return new Response(
      JSON.stringify({ extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Image processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to process image. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
