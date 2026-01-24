export const siteConfig = {
    name: "Ing AI",
    description: "Dein KI-gestützter Schreibassistent für akademische Arbeiten",
    url: "https://ingai-editor.xyz",
    ogImage: "https://ingai-editor.xyz/opengraph-image",
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
