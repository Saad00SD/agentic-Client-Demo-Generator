from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BrandingConfig(BaseModel):
    logo: str = "assets/lkq-logo.svg"
    primaryColor: str = "#085CF0"
    secondaryColor: str = "#000000"
    accentColor: str = "#F3FF66"
    darkCardColor: str = "#1A1A1A"
    surfaceColor: str = "#FFFFFF"
    pageBgColor: str = "#F2F2F2"

class CountryConfig(BaseModel):
    code: str = "RO"
    name: str = "Romania"
    currency: str = "RON"
    symbol: str = "RON"
    pointsRatio: float = 100.0

class GeographicConfig(BaseModel):
    country: str = "Romania"
    regions: List[str] = ["Bucharest", "Transylvania", "Moldavia", "Banat"]
    branches: List[str] = ["Bucharest Central", "Cluj-Napoca", "Timișoara", "Iași", "Brașov"]
    defaultBranch: str = "Bucharest Central"

class LanguageConfig(BaseModel):
    code: str
    label: str

class CampaignModalConfig(BaseModel):
    lede: str = ""
    rows: List[List[str]] = []
    note: str = ""

class CampaignConfig(BaseModel):
    id: str
    name: str
    type: str = "Hit & Win Incentive"
    img: str = "assets/img/photo-goods-to-person.jpg"
    tileImage: Optional[str] = None
    heroImage: Optional[str] = None
    href: str = "#"
    blurb: str = ""
    status: str = "Active"
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    content: Optional[str] = None
    ctaText: Optional[str] = "Open campaign →"
    rewardPoints: Optional[int] = 0
    modal: Optional[CampaignModalConfig] = None

class CustomerConfig(BaseModel):
    business: str = "Auto Service Central"
    town: str = "Bucharest"
    owner: str = "Alexandru Popa"
    initials: str = "AP"
    account: str = "RO-99120"
    branch: str = "Bucharest Central"
    since: str = "January 2021"
    profile: str = "Independent · 5 ramps · 8 staff"

class ClientConfig(BaseModel):
    clientName: str = "Renault"
    platformName: str = "Pulse"
    tagline: str = "Driven by Excellence"
    defaultLanguage: str = "en"
    branding: BrandingConfig = Field(default_factory=BrandingConfig)
    country: CountryConfig = Field(default_factory=CountryConfig)
    countryConfig: GeographicConfig = Field(default_factory=GeographicConfig)
    languages: List[LanguageConfig] = Field(default_factory=lambda: [
        LanguageConfig(code="en", label="English"),
        LanguageConfig(code="ro", label="Română")
    ])
    customer: CustomerConfig = Field(default_factory=CustomerConfig)
    campaigns: List[CampaignConfig] = Field(default_factory=list)
