import {
    Button,
    Heading,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface NewProjectEmailProps {
    userName?: string;
    projectName?: string;
    projectDescription?: string;
    projectUrl?: string;
}

export const NewProjectEmail = ({
    userName = 'User',
    projectName = 'New Project',
    projectDescription,
    projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/editor`,
}: NewProjectEmailProps) => {
    const previewText = `New project created: ${projectName}`;

    return (
        <EmailLayout preview={previewText}>
            <Heading className="text-foreground text-[24px] font-bold p-0 my-[30px] mx-0 text-center">
                Project Created!
            </Heading>
            <Text className="text-foreground text-[16px] leading-[26px]">
                Hello {userName},
            </Text>
            <Text className="text-foreground text-[16px] leading-[26px]">
                You have successfully created a new project: <strong>{projectName}</strong>
                {projectDescription && (
                    <> - {projectDescription}</>
                )}
            </Text>
            <Section className="text-center py-[32px]">
                <Button
                    className="bg-primary text-foreground rounded-full font-medium px-[32px] py-[12px] text-[16px] decoration-none inline-block"
                    href={projectUrl}
                >
                    Start Writing
                </Button>
            </Section>
            <Text className="text-muted text-[14px] leading-[24px] mt-[20px]">
                This is an automated notification from Ing AI.
            </Text>
        </EmailLayout>
    );
};

export default NewProjectEmail;
