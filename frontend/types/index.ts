export interface BrandingConfig {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkCardColor: string;
  surfaceColor: string;
  pageBgColor: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  pointsRatio: number;
}

export interface GeographicConfig {
  country: string;
  regions: string[];
  branches: string[];
  defaultBranch: string;
}

export interface LanguageConfig {
  code: string;
  label: string;
}

export interface CampaignModalConfig {
  lede?: string;
  rows?: [string, string][];
  note?: string;
}

export interface CampaignConfig {
  id: string;
  name: string;
  type: string;
  img: string;
  tileImage?: string;
  heroImage?: string;
  href?: string;
  blurb: string;
  status: string;
  startDate?: string;
  endDate?: string;
  content?: string;
  ctaText?: string;
  rewardPoints?: number;
  modal?: CampaignModalConfig;
}

export interface CustomerConfig {
  business: string;
  town: string;
  owner: string;
  initials: string;
  account: string;
  branch: string;
  since: string;
  profile: string;
}

export interface ClientConfig {
  clientName: string;
  platformName: string;
  tagline: string;
  defaultLanguage: string;
  branding: BrandingConfig;
  country: CountryConfig;
  countryConfig: GeographicConfig;
  languages: LanguageConfig[];
  customer: CustomerConfig;
  homepage: { title: string; description: string; heroImage: string };
  campaigns: CampaignConfig[];
}

export interface GenerationResult {
  traceId?: string;
  projectId: string;
  status: string;
  previewUrl: string;
  downloadUrl: string;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}
