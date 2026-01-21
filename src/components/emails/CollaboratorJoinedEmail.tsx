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
            <Heading className="text-foreground text-[24px] font-bold p-0 my-[30px] mx-0 text-center">
                New Collaborator
            </Heading>
            <Text className="text-foreground text-[16px] leading-[26px]">
                Hello {ownerName},
            </Text>
            <Text className="text-foreground text-[16px] leading-[26px]">
                Good news! <strong>{collaboratorName}</strong> has joined your project <strong>{projectName}</strong>. You can now work on your research together in real-time.
            </Text>
            <Section className="text-center py-[32px]">
                <Button
                    className="bg-primary text-white rounded-lg font-bold px-[24px] py-[12px] text-[16px] decoration-none inline-block"
                    href={projectUrl}
                >
                    View Project
                </Button>
            </Section>
            <Text className="text-muted text-[14px] leading-[24px] mt-[20px]">
                This is an automated notification from Ing AI.
            </Text>
        </EmailLayout>
    );
};

export default CollaboratorJoinedEmail;
