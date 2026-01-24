import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Hr,
    Tailwind,
    Link,
} from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
    preview?: string;
    children: React.ReactNode;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ingai-editor.xyz";

const colors = {
    primary: "#3ECF8E",
    background: "#fafafa",
    foreground: "#171717",
    muted: "#737373",
    border: "#e5e5e5",
    card: "#ffffff",
};

export const EmailLayout = ({
    preview,
    children,
}: EmailLayoutProps) => {
    return (
        <Html>
            <Head />
            {preview && <Preview>{preview}</Preview>}
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                primary: colors.primary,
                                background: colors.background,
                                foreground: colors.foreground,
                                muted: colors.muted,
                                border: colors.border,
                                card: colors.card,
                            },
                        },
                    },
                }}
            >
                <Body className="bg-background font-sans text-foreground my-auto mx-auto px-2">
                    <Container className="border border-border rounded-xl mx-auto my-[40px] p-[20px] max-w-[465px] bg-card shadow-sm">
                        <Section className="mt-[32px]">
                            <Img
                                src={`${baseUrl}/logos/logosApp/ing_AI.png`}
                                width="120"
                                height="auto"
                                alt="Ing AI"
                                className="mx-auto my-0 block"
                            />
                        </Section>

                        <Section className="px-4">
                            {children}
                        </Section>

                        <Hr className="border-border mx-0 my-[26px]" />

                        <Section className="px-4">
                            <Text className="text-muted text-[12px] leading-[24px]">
                                Ing AI - Your AI Research Assistant
                            </Text>
                            <Text className="text-muted text-[12px] leading-[24px] mt-0">
                                <Link
                                    href={`${baseUrl}`}
                                    className="text-muted underline"
                                >
                                    Visit Website
                                </Link>
                                {" • "}
                                <Link
                                    href={`${baseUrl}/#pricing`}
                                    className="text-muted underline"
                                >
                                    Pricing
                                </Link>
                                {" • "}
                                <Link
                                    href={`${baseUrl}/blog`}
                                    className="text-muted underline"
                                >
                                    Blog
                                </Link>
                                {" • "}
                                <Link
                                    href={`${baseUrl}/editor`}
                                    className="text-muted underline"
                                >
                                    Account Settings
                                </Link>
                            </Text>
                            <Text className="text-muted text-[12px] leading-[20px] mt-2">
                                <Link
                                    href={`${baseUrl}/terms`}
                                    className="text-muted underline"
                                >
                                    Terms
                                </Link>
                                {" • "}
                                <Link
                                    href={`${baseUrl}/privacy`}
                                    className="text-muted underline"
                                >
                                    Privacy
                                </Link>
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default EmailLayout;
