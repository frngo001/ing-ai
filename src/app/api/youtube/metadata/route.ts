import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache/cache-service';
import { requestDeduplicator } from '@/lib/cache/request-deduplicator';
import { devWarn, devError } from '@/lib/utils/logger';

interface YouTubeMetadata {
    title: string;
    description: string;
    thumbnail: string;
    duration: string;
    youtubeId: string;
}

/**
 * Extrahiert die Video-ID aus einem YouTube-Link oder gibt die ID zurück, falls bereits eine ID übergeben wurde
 * Unterstützt verschiedene YouTube-URL-Formate:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - VIDEO_ID (direkte ID)
 */
function extractVideoId(urlOrId: string): string {
    // Wenn es bereits eine Video-ID ist (kein http/https), direkt zurückgeben
    if (!urlOrId.includes('http') && !urlOrId.includes('://')) {
        // Entferne Query-Parameter falls vorhanden
        return urlOrId.split('?')[0].split('&')[0];
    }

    // YouTube URL Patterns - extrahiere Video-ID auch mit Query-Parametern
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = urlOrId.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    throw new Error(`Invalid YouTube URL or ID: ${urlOrId}`);
}

/**
 * Extrahiert die Dauer aus einem YouTube-Video
 * Nutzt oEmbed API und optional YouTube Data API v3
 */
async function fetchYouTubeMetadata(urlOrId: string): Promise<YouTubeMetadata> {
    const videoId = extractVideoId(urlOrId);
    // YouTube oEmbed API (kostenlos, keine API-Key benötigt)
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const oEmbedResponse = await fetch(oEmbedUrl);
    if (!oEmbedResponse.ok) {
        throw new Error(`YouTube oEmbed API error: ${oEmbedResponse.statusText}`);
    }
    
    const oEmbedData = await oEmbedResponse.json();
    
    // Thumbnail URL - nutze maxresdefault wenn verfügbar, sonst hqdefault
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    // Versuche Dauer über YouTube Data API v3 zu holen (wenn API-Key vorhanden)
    let duration = "N/A";
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    if (youtubeApiKey) {
        try {
            const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${youtubeApiKey}`;
            const apiResponse = await fetch(apiUrl);
            
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                if (apiData.items && apiData.items.length > 0) {
                    const durationStr = apiData.items[0].contentDetails.duration;
                    duration = parseDuration(durationStr);
                }
            }
        } catch (error) {
            devWarn('YouTube Data API error:', error);
            // Fallback: Dauer bleibt "N/A"
        }
    }
    
    // Extrahiere Beschreibung aus oEmbed oder nutze Author als Fallback
    // Wir geben nur den Autor-Namen zurück, die Übersetzung von "Von" erfolgt in der Komponente
    const description = oEmbedData.author_name || 'YouTube Video';
    
    return {
        title: oEmbedData.title || 'Untitled',
        description,
        thumbnail: thumbnailUrl,
        duration,
        youtubeId: videoId,
    };
}

/**
 * Konvertiert ISO 8601 Duration (PT4M13S) zu MM:SS Format
 */
function parseDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "N/A";
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export async function POST(req: NextRequest) {
    try {
        const { videoIds, videoUrls } = await req.json();
        
        // Unterstütze sowohl videoIds als auch videoUrls für Rückwärtskompatibilität
        const urlsOrIds = videoUrls || videoIds;
        
        if (!urlsOrIds || !Array.isArray(urlsOrIds) || urlsOrIds.length === 0) {
            return NextResponse.json(
                { error: 'videoUrls or videoIds array is required' },
                { status: 400 }
            );
        }
        
        const cache = CacheService.getInstance();
        const results: YouTubeMetadata[] = [];
        
        // Lade Metadaten für alle Video-URLs oder IDs
        for (const urlOrId of urlsOrIds) {
            try {
                const videoId = extractVideoId(urlOrId);
                const cacheKey = `youtube:${videoId}`;
                const cached = cache.get<YouTubeMetadata>(cacheKey);
                
                if (cached) {
                    results.push(cached);
                } else {
                    // Deduplicate concurrent identical requests
                    const metadata = await requestDeduplicator.deduplicate(
                        cacheKey,
                        () => fetchYouTubeMetadata(urlOrId)
                    );
                    
                    // Cache für 24 Stunden
                    cache.set(cacheKey, metadata, 1000 * 60 * 60 * 24);
                    results.push(metadata);
                }
            } catch (error) {
                devError(`Error processing video URL/ID: ${urlOrId}`, error);
                // Überspringe ungültige URLs/IDs und fahre mit den nächsten fort
            }
        }
        
        return NextResponse.json({ videos: results });
    } catch (error) {
        devError('YouTube metadata API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch YouTube metadata' },
            { status: 500 }
        );
    }
}

