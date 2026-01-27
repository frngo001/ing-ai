import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy Route for YouTube Thumbnails
 * Fixed the "Effective Cache Duration" issue in PSI by providing long-term caching
 * for external assets that usually have short TTLs (like i.ytimg.com).
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ videoId: string }> }
) {
    const { videoId } = await params;

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return new NextResponse('Invalid Video ID', { status: 400 });
    }

    // Use maxresdefault for highest quality, fallback logic could be added if needed
    const ytUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    try {
        const response = await fetch(ytUrl, {
            next: { revalidate: 31536000 } // Cache for 1 year at the edge
        });

        if (!response.ok) {
            // Fallback to hqdefault if maxres fails
            const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            const fallbackResponse = await fetch(fallbackUrl);
            if (!fallbackResponse.ok) {
                return new NextResponse('Thumbnail not found', { status: 404 });
            }

            const data = await fallbackResponse.arrayBuffer();
            const contentType = fallbackResponse.headers.get('content-type') || 'image/jpeg';

            return new NextResponse(data, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        }

        const data = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(data, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('YouTube Thumbnail Proxy Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
