import { Card } from "@/components/ui/card"

export function DemoPreview() {
    return (
        <section id="demo" className="py-20 md:py-28 bg-muted/30">
            <div className="container px-4 mx-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="mb-12">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                            Start writing in seconds
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl">
                            Simple, powerful interface. No setup required.
                        </p>
                    </div>

                    {/* Demo Preview */}
                    <Card className="border border-border overflow-hidden">
                        {/* Browser Bar */}
                        <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-sm text-muted-foreground font-mono">editor.jenni.ai</span>
                            </div>
                        </div>

                        {/* Editor Preview */}
                        <div className="p-8 md:p-12 bg-background">
                            <div className="space-y-6 font-mono text-sm">
                                {/* Code-style presentation */}
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">1</span>
                                        <div className="flex-1">
                                            <span className="text-primary">import</span>
                                            <span className="text-foreground"> jenni </span>
                                            <span className="text-primary">from</span>
                                            <span className="text-muted-foreground"> 'jenni-ai'</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">2</span>
                                        <div className="flex-1">
                                            <span className="text-foreground"></span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">3</span>
                                        <div className="flex-1">
                                            <span className="text-muted-foreground">// Start writing with AI assistance</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">4</span>
                                        <div className="flex-1">
                                            <span className="text-primary">const</span>
                                            <span className="text-foreground"> paper </span>
                                            <span className="text-primary">=</span>
                                            <span className="text-foreground"> jenni.</span>
                                            <span className="text-primary">create</span>
                                            <span className="text-foreground">({"{"}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">5</span>
                                        <div className="flex-1 pl-4">
                                            <span className="text-foreground">title: </span>
                                            <span className="text-muted-foreground">'Research Paper'</span>
                                            <span className="text-foreground">,</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">6</span>
                                        <div className="flex-1 pl-4">
                                            <span className="text-foreground">autocomplete: </span>
                                            <span className="text-primary">true</span>
                                            <span className="text-foreground">,</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">7</span>
                                        <div className="flex-1 pl-4">
                                            <span className="text-foreground">citations: </span>
                                            <span className="text-muted-foreground">'APA'</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">8</span>
                                        <div className="flex-1">
                                            <span className="text-foreground">{"})"}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">9</span>
                                        <div className="flex-1">
                                            <span className="text-foreground"></span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-muted-foreground select-none">10</span>
                                        <div className="flex-1">
                                            <span className="text-muted-foreground">// ✨ AI starts helping immediately</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Bottom Text */}
                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Built for researchers, by researchers. No configuration needed.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
