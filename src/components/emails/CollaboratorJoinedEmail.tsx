import {
    Button,
    Heading,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface CollaboratorJoinedEmailProps {
    ownerName?: string;
    collaboratorName?: string;
    projectName?: string;
    projectUrl?: string;
}

export const CollaboratorJoinedEmail = ({
    ownerName = 'Project Owner',
    collaboratorName = 'A user',
    projectName = 'Project',
    projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}`,
}: CollaboratorJoinedEmailProps) => {
    const previewText = `${collaboratorName} has joined your project ${projectName}`;

    return (
        <EmailLayout preview={previewText}>
            <Heading className="text-foreground text-[24px] font-bold p-0 my-[30px] mx-0">
                New Collaborator Joined
            </Heading>
            <Text className="text-foreground text-[16px] leading-[26px]">
                Hello {ownerName},
            </Text>
            <Text className="text-foreground text-[16px] leading-[26px]">
                Good news! <strong>{collaboratorName}</strong> has accessed the project <strong>{projectName}</strong>.
            </Text>
            <Section className="text-center py-[20px]">
                <Button
                    className="bg-primary text-white text-[16px] rounded-[4px] px-[24px] py-[12px] no-underline block w-full max-w-[200px] mx-auto text-center"
                    href={projectUrl}
                >
                    View Project
                </Button>
            </Section>
            <Text className="text-muted text-[14px] leading-[24px] mt-[20px]">
                Notification from Ing AI.
            </Text>
        </EmailLayout>
    );
};

export default CollaboratorJoinedEmail;
