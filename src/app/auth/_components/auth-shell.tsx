import { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AuthShellProps = {
    title: string;
    subtitle: string;
    formTitle: string;
    formSubtitle: string;
    children: ReactNode;
    footer: ReactNode;
};

const HIGHLIGHTS = [
    {
        title: "KI-Autocomplete",
        description: "Schreiben wie im Editor der Landingpage – schnell und kontextbezogen.",
    },
    {
        title: "Sofortige Zitationen",
        description: "APA, MLA, Chicago und mehr direkt im Flow.",
    },
    {
        title: "Plagiatscheck",
        description: "Sicherheit wie im WhyIng-Abschnitt – du bleibst compliant.",
    },
    {
        title: "Schnelle Workflows",
        description: "Autofill, PDF-Chat und Befehle wie im HowItWorks-Bereich.",
    },
] as const;

export function AuthShell({ title, subtitle, formTitle, formSubtitle, children, footer }: AuthShellProps) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(62,207,142,0.10),transparent_35%),radial-gradient(circle_at_70%_15%,rgba(14,165,233,0.08),transparent_30%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-[-20%] h-[320px] bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

            <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center gap-10 px-4 pb-16 pt-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
                <div className="hidden space-y-8 lg:w-1/2 md:block">
                    <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 text-primary">
                        Ing AI Suite
                    </Badge>
                    <div className="space-y-3">
                        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
                        <p className="text-lg text-muted-foreground">{subtitle}</p>
                    </div>

                    <div className="hidden md:grid grid-cols-1 gap-2 lg:grid-cols-2">
                        {HIGHLIGHTS.map(({ title: featureTitle, description }) => (
                            <div
                                key={featureTitle}
                                className="rounded-lg border border-border/50 bg-card/80 p-3"
                            >
                                <p className="text-sm font-semibold">{featureTitle}</p>
                                <p className="text-xs text-muted-foreground">{description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 text-sm text-muted-foreground md:flex">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <Avatar key={i} className="h-8 w-8 border border-border/60">
                                    <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User avatar" />
                                    <AvatarFallback>AI</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">2M+ Forschende täglich</p>
                            <p className="text-xs text-muted-foreground">Bewährt in Editor, Pricing & Social Proof.</p>
                        </div>
                    </div>
                </div>

                <Card className="relative w-full max-w-[480px] border-border/50 bg-card/90 shadow-lg backdrop-blur">
                    <div className="space-y-2 px-8 pt-8 text-center">
                        <h2 className="text-2xl font-semibold">{formTitle}</h2>
                        <p className="text-muted-foreground">{formSubtitle}</p>
                    </div>
                    <div className="px-8 pb-8 pt-4">
                        {children}
                        <Separator className="my-6" />
                        <div className="text-center text-sm text-muted-foreground">{footer}</div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

