import { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/auth/',
                    '/editor/',
                    '/settings/',
                    '/shared/',
                    '/admin/',
                    '/_next/',
                    '/private/',
                ],
            },
        ],
        sitemap: `${siteConfig.url}/sitemap.xml`,
    }
}
