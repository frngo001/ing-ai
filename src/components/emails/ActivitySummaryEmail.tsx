import {
    Button,
    Heading,
    Section,
    Text,
    Hr,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './EmailLayout';

interface ActivityItem {
    type: 'document_created' | 'document_edited' | 'project_created' | 'citation_added' | 'export_completed';
    title: string;
    timestamp: string;
}

interface ActivitySummaryEmailProps {
    userName?: string;
    period?: 'daily' | 'weekly';
    activities?: ActivityItem[];
    stats?: {
        documentsCreated: number;
        documentsEdited: number;
        citationsAdded: number;
        wordsWritten: number;
    };
    dashboardUrl?: string;
}

const activityLabels: Record<ActivityItem['type'], string> = {
    document_created: 'Created document',
    document_edited: 'Edited document',
    project_created: 'Created project',
    citation_added: 'Added citation',
    export_completed: 'Exported document',
};

export const ActivitySummaryEmail = ({
    userName = 'User',
    period = 'daily',
    activities = [],
    stats = { documentsCreated: 0, documentsEdited: 0, citationsAdded: 0, wordsWritten: 0 },
    dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/editor`,
}: ActivitySummaryEmailProps) => {
    const previewText = period === 'daily'
        ? 'Your Daily Activity Summary'
        : 'Your Weekly Activity Summary';

    const heading = period === 'daily' ? 'Your Daily Summary' : 'Your Weekly Summary';

    const hasActivity = activities.length > 0 ||
        stats.documentsCreated > 0 ||
        stats.documentsEdited > 0 ||
        stats.citationsAdded > 0 ||
        stats.wordsWritten > 0;

    return (
        <EmailLayout preview={previewText}>
            <Heading className="text-foreground text-[24px] font-bold p-0 my-[30px] mx-0 text-center">
                {heading}
            </Heading>
            <Text className="text-foreground text-[16px] leading-[26px]">
                Hello {userName},
            </Text>
            <Text className="text-foreground text-[16px] leading-[26px]">
                {period === 'daily'
                    ? "Here's what you accomplished today:"
                    : "Here's what you accomplished this week:"}
            </Text>

            {hasActivity ? (
                <>
                    {/* Statistics */}
                    <Section className="my-[24px] p-[16px] bg-[#fafafa] rounded-lg">
                        <Text className="text-foreground text-[14px] font-bold m-0 mb-[12px]">
                            Your Statistics
                        </Text>
                        <Text className="text-foreground text-[14px] m-0">
                            Documents created: <strong>{stats.documentsCreated}</strong>
                        </Text>
                        <Text className="text-foreground text-[14px] m-0">
                            Documents edited: <strong>{stats.documentsEdited}</strong>
                        </Text>
                        <Text className="text-foreground text-[14px] m-0">
                            Citations added: <strong>{stats.citationsAdded}</strong>
                        </Text>
                        <Text className="text-foreground text-[14px] m-0">
                            Words written: <strong>{stats.wordsWritten.toLocaleString()}</strong>
                        </Text>
                    </Section>

                    {/* Recent Activities */}
                    {activities.length > 0 && (
                        <>
                            <Hr className="border-[#e5e5e5] my-[24px]" />
                            <Text className="text-foreground text-[14px] font-bold mb-[12px]">
                                Recent Activity
                            </Text>
                            {activities.slice(0, 5).map((activity, index) => (
                                <Text key={index} className="text-foreground text-[14px] m-0 mb-[8px]">
                                    {activityLabels[activity.type]}: <strong>{activity.title}</strong>
                                    <br />
                                    <span className="text-muted text-[12px]">{activity.timestamp}</span>
                                </Text>
                            ))}
                        </>
                    )}
                </>
            ) : (
                <Text className="text-muted text-[14px] text-center my-[24px]">
                    No activity recorded for this period.
                </Text>
            )}

            <Section className="text-center py-[32px]">
                <Button
                    className="bg-primary text-foreground rounded-full font-medium px-[32px] py-[12px] text-[16px] decoration-none inline-block"
                    href={dashboardUrl}
                >
                    Continue Writing
                </Button>
            </Section>
            <Text className="text-muted text-[14px] leading-[24px] mt-[20px]">
                Keep up the great work! - The Ing AI Team
            </Text>
        </EmailLayout>
    );
};

export default ActivitySummaryEmail;
