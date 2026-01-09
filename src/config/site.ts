export const siteConfig = {
    name: "Ing AI",
    description: "Dein KI-gestützter Schreibassistent für akademische Arbeiten",
    url: "https://ingai-editor.vercel.app",
    ogImage: "https://ingai-editor.vercel.app/og.jpg",
    links: {
        twitter: "https://twitter.com/ingai",
        github: "https://github.com/ingai/ing-ai",
    },
    getStartedUrl: "/auth/signup",
    pricing: {
        free: "/auth/signup?plan=free",
        pro: "/auth/signup?plan=pro",
        team: "/auth/signup?plan=team",
    },
}

export type SiteConfig = typeof siteConfig
