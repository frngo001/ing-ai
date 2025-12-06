'use client'

import { Search, Plus, FileText, MoreVertical, Clock, BookOpen, Quote, FileType } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { useLanguage } from '@/lib/i18n/use-language'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true)
    const { t } = useLanguage()

    useEffect(() => {
        // Simulate loading data
        const timer = setTimeout(() => setIsLoading(false), 1000)
        return () => clearTimeout(timer)
    }, [])

    if (isLoading) {
        return <DashboardSkeleton />
    }

    // In a real app, fetch documents from Supabase
    const recentDocuments = [
        {
            id: '1',
            title: 'Research Paper Draft',
            updatedAt: '2 hours ago',
            wordCount: 2543,
            type: 'essay',
        },
        {
            id: '2',
            title: 'Literature Review',
            updatedAt: 'Yesterday',
            wordCount: 1823,
            type: 'essay',
        },
        {
            id: '3',
            title: 'Blog Post Ideas',
            updatedAt: '3 days ago',
            wordCount: 456,
            type: 'blog',
        },
    ]

    return (
        <ErrorBoundary>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">{t('dashboard.yourDocuments')}</h1>
                        <p className="text-muted-foreground">{t('dashboard.createManage')}</p>
                    </div>
                    <Button asChild className="gap-2">
                        <Link href="/editor/new">
                            <Plus className="h-4 w-4" />
                            {t('editor.newDocument')}
                        </Link>
                    </Button>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={`${t('common.search')}...`} className="pl-10" />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('dashboard.totalDocuments')}</p>
                                <p className="text-2xl font-bold">3</p>
                            </div>
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('dashboard.totalWords')}</p>
                                <p className="text-2xl font-bold">4.8K</p>
                            </div>
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('dashboard.citations')}</p>
                                <p className="text-2xl font-bold">12</p>
                            </div>
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('dashboard.sources')}</p>
                                <p className="text-2xl font-bold">8</p>
                            </div>
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                    </Card>
                </div>

                {/* Documents Grid */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {t('dashboard.recentDocuments')}
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentDocuments.map((doc) => (
                            <Link key={doc.id} href={`/editor/${doc.id}`}>
                                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <FileText className="h-8 w-8 text-primary" />
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                {doc.type}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                                                {doc.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {doc.wordCount} words • Updated {doc.updatedAt}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}

                        {/* New Document Card */}
                        <Link href="/editor/new">
                            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-dashed border-2 flex items-center justify-center min-h-[180px] group">
                                <div className="text-center">
                                    <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                                    <p className="text-muted-foreground group-hover:text-primary transition-colors">
                                        {t('editor.newDocument')}
                                    </p>
                                </div>
                            </Card>
                        </Link>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    )
}
