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
            <Heading className="text-foreground text-[24px] font-bold p-0 my-[30px] mx-0">
                Project Invitation
            </Heading>
            <Text className="text-foreground text-[16px] leading-[26px]">
                Hello,
            </Text>
            <Text className="text-foreground text-[16px] leading-[26px]">
                <strong>{inviterName}</strong> has invited you to collaborate on the project <strong>{projectName}</strong>.
            </Text>
            <Section className="text-center py-[20px]">
                <Button
                    className="bg-primary text-white text-[16px] rounded-[4px] px-[24px] py-[12px] no-underline block w-full max-w-[200px] mx-auto text-center"
                    href={actionUrl}
                >
                    Join Project
                </Button>
            </Section>
            <Text className="text-foreground text-[16px] leading-[26px] mt-[10px]">
                or copy and paste this link into your browser:
                <br />
                <Link href={actionUrl} className="text-primary underline">
                    {actionUrl}
                </Link>
            </Text>
            <Text className="text-muted text-[14px] leading-[24px] mt-[20px]">
                This invitation was sent from Ing AI.
            </Text>
        </EmailLayout>
    );
};

export default ProjectInvitationEmail;
