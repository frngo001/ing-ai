// Main exports for source fetching module

export { SourceFetcher } from './source-fetcher'
export { SourceNormalizer } from './normalizer'
export { BaseApiClient } from './api-client'

// API Clients
export { CrossRefClient } from './apis/crossref-client'
export { PubMedClient } from './apis/pubmed-client'
export { ArxivClient } from './apis/arxiv-client'
export { SemanticScholarClient } from './apis/semantic-scholar-client'
export { OpenAlexClient } from './apis/openalex-client'
export { CoreClient } from './apis/core-client'
export { EuropePmcClient } from './apis/europepmc-client'
export { DoajClient } from './apis/doaj-client'
export { BiorxivClient } from './apis/biorxiv-client'
export { DataCiteClient } from './apis/datacite-client'
export { ZenodoClient } from './apis/zenodo-client'
export { BaseClient } from './apis/base-client'
export { PlosClient } from './apis/plos-client'
export { OpenCitationsClient } from './apis/opencitations-client'

// Types
export type {
    SourceType,
    Author,
    NormalizedSource,
    SearchQuery,
    SearchResult,
    ApiResponse,
    RateLimitInfo,
    ApiConfig,
    SourceFetcherOptions,
    ApiPriority,
    ApiMetrics,
} from './types'
