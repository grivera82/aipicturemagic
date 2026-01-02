/**
 * AI Picture Magic - Cloudflare Worker
 * Secure proxy for fal.ai API calls
 */

const FAL_API_BASE = 'https://queue.fal.run/fal-ai/nano-banana/edit';
const FAL_REQUESTS_BASE = 'https://queue.fal.run/fal-ai/nano-banana/requests';

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Route: POST /generate - Submit generation request
            if (path === '/generate' && request.method === 'POST') {
                return await handleGenerate(request, env);
            }

            // Route: GET /status/:requestId - Check status
            if (path.startsWith('/status/') && request.method === 'GET') {
                const requestId = path.split('/status/')[1];
                return await handleStatus(requestId, env);
            }

            // Route: GET /result/:requestId - Get result
            if (path.startsWith('/result/') && request.method === 'GET') {
                const requestId = path.split('/result/')[1];
                return await handleResult(requestId, env);
            }

            // Health check
            if (path === '/' || path === '/health') {
                return jsonResponse({ status: 'ok', service: 'AI Picture Magic API' });
            }

            return jsonResponse({ error: 'Not found' }, 404);

        } catch (error) {
            console.error('Worker error:', error);
            return jsonResponse({ error: error.message || 'Internal server error' }, 500);
        }
    }
};

/**
 * Handle image generation request
 */
async function handleGenerate(request, env) {
    const apiKey = env.FAL_API_KEY;

    if (!apiKey) {
        return jsonResponse({ error: 'API key not configured' }, 500);
    }

    const body = await request.json();

    // Validate request body
    if (!body.prompt || !body.image_urls || body.image_urls.length === 0) {
        return jsonResponse({ error: 'Missing required fields: prompt and image_urls' }, 400);
    }

    // Forward to fal.ai
    const response = await fetch(FAL_API_BASE, {
        method: 'POST',
        headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: body.prompt,
            image_urls: body.image_urls,
            num_images: body.num_images || 1,
            output_format: body.output_format || 'png'
        })
    });

    const data = await response.json();

    if (!response.ok) {
        return jsonResponse({ error: data.detail || 'Generation request failed' }, response.status);
    }

    return jsonResponse(data);
}

/**
 * Check generation status
 */
async function handleStatus(requestId, env) {
    const apiKey = env.FAL_API_KEY;

    if (!apiKey) {
        return jsonResponse({ error: 'API key not configured' }, 500);
    }

    const response = await fetch(`${FAL_REQUESTS_BASE}/${requestId}/status`, {
        headers: {
            'Authorization': `Key ${apiKey}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        return jsonResponse({ error: data.detail || 'Status check failed' }, response.status);
    }

    return jsonResponse(data);
}

/**
 * Get generation result
 */
async function handleResult(requestId, env) {
    const apiKey = env.FAL_API_KEY;

    if (!apiKey) {
        return jsonResponse({ error: 'API key not configured' }, 500);
    }

    const response = await fetch(`${FAL_REQUESTS_BASE}/${requestId}`, {
        headers: {
            'Authorization': `Key ${apiKey}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        return jsonResponse({ error: data.detail || 'Result fetch failed' }, response.status);
    }

    return jsonResponse(data);
}

/**
 * Helper to create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    });
}
