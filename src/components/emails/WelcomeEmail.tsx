import {
    Button,
    Heading,
    Section,
    Text,
    Hr,
    Link,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface WelcomeEmailProps {
    userName?: string;
}

export const WelcomeEmail = ({ userName = 'User' }: WelcomeEmailProps) => {
    const previewText = `Welcome to Ing AI - Your Research & Writing Assistant`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    return (
        <EmailLayout preview={previewText}>
            <Heading className="text-foreground text-[24px] font-bold p-0 my-[30px] mx-0 text-center">
                Welcome, {userName}!
            </Heading>
            <Text className="text-foreground text-[16px] leading-[26px]">
                We're thrilled to have you here! Ing AI is your ultimate companion for academic and professional writing.
                Get ready to supercharge your productivity and take your research to the next level.
            </Text>

            <Section className="my-[32px]">
                <Section className="mb-[24px]">
                    <Heading as="h2" className="text-foreground text-[18px] font-semibold mb-[12px]">
                        What you can do with Ing AI:
                    </Heading>

                    <Section className="mb-[16px]">
                        <Text className="m-0 font-bold text-primary">Context-Aware Autocomplete</Text>
                        <Text className="m-0 text-muted text-[14px]">Experience next-gen writing where AI understands your context and continues your sentences logically.</Text>
                    </Section>

                    <Section className="mb-[16px]">
                        <Text className="m-0 font-bold text-primary">Specialized AI Agents</Text>
                        <Text className="m-0 text-muted text-[14px]">Guided workflows for your essays, bachelor or master thesis, from topic finding to the final writing phase.</Text>
                    </Section>

                    <Section className="mb-[16px]">
                        <Text className="m-0 font-bold text-primary">Research Library</Text>
                        <Text className="m-0 text-muted text-[14px]">Search over 250 million scientific articles and manage your citations with support for &gt;9000 styles.</Text>
                    </Section>

                    <Section className="mb-[16px]">
                        <Text className="m-0 font-bold text-primary">Professional Editor</Text>
                        <Text className="m-0 text-muted text-[14px]">Real-time collaboration, native math support (LaTeX), and flexible exports to Word, PDF, and more.</Text>
                    </Section>
                </Section>

                <Section className="text-center mt-[32px]">
                    <Button
                        className="bg-primary text-foreground rounded-full font-medium px-[32px] py-[12px] text-[16px] decoration-none inline-block"
                        href={`${baseUrl}/editor`}
                    >
                        Create Your First Project
                    </Button>
                </Section>
            </Section>

            <Hr className="border-border mx-0 my-[26px]" />

            <Section>
                <Text className="text-muted text-[14px] leading-[24px]">
                    Need help getting started? Check out our <Link href={`${baseUrl}/#bento-features`} className="text-primary underline">Documentation</Link>.
                </Text>
                <Text className="text-muted text-[14px] leading-[24px] mt-[16px]">
                    Happy writing,<br />
                    The Ing AI Team
                </Text>
            </Section>
        </EmailLayout>
    );
};

export default WelcomeEmail;
