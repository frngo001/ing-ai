import {
    Button,
    Heading,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface WelcomeEmailProps {
    userName?: string;
}

export const WelcomeEmail = ({ userName = 'User' }: WelcomeEmailProps) => {
    const previewText = `Welcome to Ing AI - Your Research & Writing Assistant`;

    return (
        <EmailLayout preview={previewText}>
            <Heading className="text-foreground text-[24px] font-bold p-0 my-[30px] mx-0">
                Welcome, {userName}!
            </Heading>
            <Text className="text-foreground text-[16px] leading-[26px]">
                We're excited to have you on board. Ing AI is here to help you write better,
                faster, and with more confidence.
            </Text>
            <Section className="py-[24px]">
                <Text className="text-foreground text-[16px] leading-[26px]">
                    Here's what you can do next:
                </Text>
                <ul className="text-foreground text-[16px] leading-[26px] pl-[26px]">
                    <li>Create your first project</li>
                    <li>Import research papers (PDF, BibTeX)</li>
                    <li>Use AI Commands to generate content</li>
                </ul>
            </Section>
            <Text className="text-muted text-[16px] leading-[26px]">
                If you have any questions, just reply to this email. Happy writing!
            </Text>
        </EmailLayout>
    );
};

export default WelcomeEmail;
