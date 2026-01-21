import {
    Button,
    Heading,
    Section,
    Text,
    Link,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface ProjectInvitationEmailProps {
    inviterName?: string;
    projectName?: string;
    actionUrl?: string;
}

export const ProjectInvitationEmail = ({
    inviterName = 'A user',
    projectName = 'Project',
    actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}`,
}: ProjectInvitationEmailProps) => {
    const previewText = `${inviterName} invited you to collaborate on ${projectName}`;

    return (
        <EmailLayout preview={previewText}>
            <Heading className="text-foreground text-[24px] font-bold p-0 my-[30px] mx-0 text-center">
                Project Invitation
            </Heading>
            <Text className="text-foreground text-[16px] leading-[26px]">
                Hello there!
            </Text>
            <Text className="text-foreground text-[16px] leading-[26px]">
                <strong>{inviterName}</strong> has invited you to collaborate on the project <strong>{projectName}</strong>. Join the team and start working together on Ing AI.
            </Text>
            <Section className="text-center py-[32px]">
                <Button
                    className="bg-primary text-white rounded-lg font-bold px-[24px] py-[12px] text-[16px] decoration-none inline-block"
                    href={actionUrl}
                >
                    Join Project
                </Button>
            </Section>
            <Section className="mb-[24px]">
                <Text className="text-foreground text-[14px] leading-[24px]">
                    Or copy and paste this link into your browser:
                </Text>
                <Link href={actionUrl} className="text-primary underline text-[14px] break-all">
                    {actionUrl}
                </Link>
            </Section>
            <Text className="text-muted text-[14px] leading-[24px] mt-[20px]">
                This invitation was sent from Ing AI - Your AI Research Assistant.
            </Text>
        </EmailLayout>
    );
};

export default ProjectInvitationEmail;
