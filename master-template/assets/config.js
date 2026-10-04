/* ============================================================
   Master Demo Template — Central Client Configuration
   ============================================================ */

window.CLIENT_CONFIG = {
  clientName: "XPENG Vector",
  platformName: "Vector",
  tagline: "Drive the Future",
  defaultLanguage: "en",

  country: {
    code: "UK",
    name: "United Kingdom",
    currency: "GBP",
    symbol: "£",
    pointsRatio: 100
  },

  countryConfig: {
    country: "United Kingdom",
    regions: ["North", "Central", "South", "Scotland"],
    branches: ["London Central", "Manchester", "Birmingham", "Leeds", "Glasgow"],
    defaultBranch: "London Central"
  },

  languages: [
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
    { code: "nl", label: "Nederlands" }
  ],

  branding: {
    logo: "assets/xpeng-logo.png",
    primaryColor: "#085CF0",
    secondaryColor: "#000000",
    accentColor: "#F3FF66",
    darkCardColor: "#1A1A1A",
    surfaceColor: "#FFFFFF",
    pageBgColor: "#F2F2F2"
  },

  customer: {
    business: "Apex EV Autocentre",
    town: "London",
    owner: "Alex Morgan",
    initials: "AM",
    account: "EV-90412",
    branch: "London Central",
    since: "January 2023",
    profile: "EV Specialist · 6 bays · 10 staff"
  },

  campaigns: [
    {
      id: "ev-service-ready",
      name: "EV Service Ready",
      type: "Certification",
      img: "assets/img/kv-sales-pathway.jpg",
      href: "ev-service-ready.html",
      blurb: "EV high voltage safety and diagnosis certification for dealership technicians.",
      status: "Active"
    },
    {
      id: "first-time-fix",
      name: "First Time Fix Q4",
      type: "Quality Incentive",
      img: "assets/img/kv-test-drive.jpg",
      href: "first-time-fix.html",
      blurb: "Reward workshops maintaining 95%+ first time fix accuracy.",
      status: "96.2% achieved"
    },
    {
      id: "genuine-parts",
      name: "Genuine Parts Growth",
      type: "Banded Incentive",
      img: "assets/img/kv-product-certification.jpg",
      href: "genuine-parts.html",
      blurb: "Earn points bonus on genuine XPENG replacement parts.",
      status: "Silver tier"
    },
    {
      id: "service-league",
      name: "Regional Service League",
      type: "League Incentive",
      img: "assets/img/kv-retailer-league.jpg",
      href: "service-league.html",
      blurb: "Compete against regional dealership service centers.",
      status: "3rd of 24"
    }
  ]
};
