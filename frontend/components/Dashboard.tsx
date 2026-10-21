"use client";

import React, { useState } from "react";
import {
  Layers,
  Globe,
  Home,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Play,
  Download,
  Eye,
  Plus,
  Trash2,
  Upload,
  ImagePlus,
  Move,
  Palette,
  MapPin,
  RefreshCw,
  Building2,
  Sliders
} from "lucide-react";
import { ClientConfig, CampaignConfig, GenerationResult } from "../types";
import PreviewModal from "./PreviewModal";
import CampaignImageEditor from "./CampaignImageEditor";

const API_BASE = "http://localhost:8000/api";

const DEFAULT_CONFIG: ClientConfig = {
  clientName: "Renault",
  platformName: "Pulse",
  tagline: "Driven by Passion",
  defaultLanguage: "en",
  branding: {
    logo: "assets/geely-logo.svg",
    primaryColor: "#000000",
    secondaryColor: "#1a1a1a",
    accentColor: "#FFD200",
    darkCardColor: "#1A1A1A",
    surfaceColor: "#FFFFFF",
    pageBgColor: "#FAFAFA"
  },
  country: {
    code: "RO",
    name: "Romania",
    currency: "RON",
    symbol: "RON",
    pointsRatio: 100
  },
  countryConfig: {
    country: "Romania",
    regions: ["Bucharest", "Transylvania", "Moldavia", "Banat"],
    branches: ["Bucharest Central", "Cluj-Napoca", "Timișoara", "Iași"],
    defaultBranch: "Bucharest Central"
  },
  languages: [
    { code: "en", label: "English" },
    { code: "ro", label: "Română" }
  ],
  customer: {
    business: "Renault Auto Central",
    town: "Bucharest",
    owner: "Mark Ellison",
    initials: "ME",
    account: "RO-40218",
    branch: "Bucharest Central",
    since: "March 2021",
    profile: "Independent · 4 ramps · 6 staff"
  },
  homepage: {
    title: "Every car they drive moves you up",
    description: "Your month, your targets and your rewards in one place. Points are credited when the drive is logged, so what you see here is what actually happened.",
    heroImage: ""
  },
  campaigns: [
    {
      id: "trade-rewards",
      name: "Renault Sales Challenge",
      type: "Banded Incentive",
      img: "assets/img/photo-goods-to-person.jpg",
      href: "trade-rewards.html",
      blurb: "The core programme. Climb the ladder — Bronze, Silver, Gold.",
      status: "240 RON from Silver"
    },
    {
      id: "varta",
      name: "Power Days Incentive",
      type: "",
      img: "assets/img/photo-shuttle-aisle.jpg",
      href: "varta-power-days.html",
      blurb: "Supplier funded. Points for every battery above baseline.",
      status: "20 RON earned"
    },
    {
      id: "brake",
      name: "Brake Focus Q4",
      type: "",
      img: "assets/img/photo-pickstation-portrait.jpg",
      href: "brake-focus.html",
      blurb: "Discs, pads and fluid, each with its own target.",
      status: "140 RON earned"
    },
    {
      id: "league",
      name: "The Forward League",
      type: "League Incentive",
      img: "assets/img/photo-highbay-wide.jpg",
      href: "league.html",
      blurb: "Your workshop against the rest of the region.",
      status: "14th of 38, up 5"
    }
  ]
};

const INITIAL_CONFIG: ClientConfig = {
  ...DEFAULT_CONFIG,
  clientName: "",
  platformName: "",
  tagline: "",
  branding: { ...DEFAULT_CONFIG.branding, logo: "" },
  country: { ...DEFAULT_CONFIG.country, code: "", name: "", symbol: "" },
  countryConfig: { ...DEFAULT_CONFIG.countryConfig, country: "", regions: [], branches: [], defaultBranch: "" },
  homepage: { title: "", description: "", heroImage: "" },
  campaigns: DEFAULT_CONFIG.campaigns.map(campaign => ({
    ...campaign, name: "", type: "", blurb: "", status: ""
  }))
};

export default function Dashboard() {
  const [config, setConfig] = useState<ClientConfig>(INITIAL_CONFIG);
  const [rawRegions, setRawRegions] = useState<string>("");
  const [rawBranches, setRawBranches] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"client" | "country" | "homepage" | "campaigns">("client");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageEditor, setImageEditor] = useState<{ id: string; source: string } | null>(null);

  const missingFields = [
    ["Client Name", config.clientName],
    ["Platform Name", config.platformName],
    ["Tagline", config.tagline],
    ["Client Logo", config.branding.logo],
    ["Hero title", config.homepage.title],
    ["Hero description", config.homepage.description],
    ["Country Name", config.country.name],
    ["Regions", config.countryConfig.regions.join("")],
    ["Branches", config.countryConfig.branches.join("")]
  ].filter(([, value]) => !value.trim()).map(([label]) => label);
  const canGenerate = missingFields.length === 0;

  const handleLogoFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        updateBranding("logo", dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCampaignImageUpload = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setImageEditor({ id: config.campaigns[idx].id, source: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Generate Demo click
  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);
    setResult(null);
    setGenLogs(["Generating your demo from the master template and entered details..."]);

    try {
      const res = await fetch(`${API_BASE}/generate-direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientConfig: config })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Generation failed");
      if (Array.isArray(data.executionLog)) {
        setGenLogs((prev) => [...prev, ...data.executionLog]);
      }
      setResult({
        projectId: data.projectId,
        status: data.status,
        previewUrl: `${API_BASE}/projects/${data.projectId}/preview/index.html`,
        downloadUrl: `${API_BASE}/projects/${data.projectId}/download`,
        validation: data.validation
      });
      setGenLogs((prev) => [...prev, `Workflow Completed Successfully! Project: ${data.projectId}`]);
    } catch (e: any) {
      setGenLogs((prev) => [...prev, `Generation Error: Could not connect to generator backend.`]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper form updates
  const updateBranding = (field: string, val: string) => {
    setConfig((prev) => ({
      ...prev,
      branding: { ...prev.branding, [field]: val }
    }));
  };

  const updateCountry = (field: string, val: any) => {
    setConfig((prev) => ({
      ...prev,
      country: { ...prev.country, [field]: val }
    }));
  };

  const addCampaign = () => {
    const newId = `camp-${crypto.randomUUID()}`;
    const newCamp: CampaignConfig = {
      id: newId,
      name: "",
      type: "",
      img: "assets/img/photo-goods-to-person.jpg",
      blurb: "",
      status: ""
    };
    setConfig((prev) => ({ ...prev, campaigns: [...prev.campaigns, newCamp] }));
  };

  const removeCampaign = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      campaigns: prev.campaigns.filter((_, i) => i !== idx)
    }));
  };

  const updateCampaign = (idx: number, field: string, val: string) => {
    setConfig((prev) => {
      const updated = [...prev.campaigns];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, campaigns: updated };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-gray-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Client Demo Generator

              </h1>
              {/* <p className="text-xs text-gray-400">One Master Template + Structured Configuration = Custom Demos</p> */}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI Engine Online
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Tabs Column (Left - 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-800 bg-gray-950/60 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("client")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-lg transition ${activeTab === "client" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
                  }`}
              >
                <Palette className="w-4 h-4" /> Client & Branding
              </button>
              <button
                onClick={() => setActiveTab("homepage")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-lg transition ${activeTab === "homepage" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
                  }`}
              >
                <Home className="w-4 h-4" /> Homepage
              </button>
              <button
                onClick={() => setActiveTab("country")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-lg transition ${activeTab === "country" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
                  }`}
              >
                <Globe className="w-4 h-4" /> Country & Geography
              </button>
              <button
                onClick={() => setActiveTab("campaigns")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-lg transition ${activeTab === "campaigns" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
                  }`}
              >
                <Megaphone className="w-4 h-4" /> Campaigns ({config.campaigns.length})
              </button>
            </div>

            {/* TAB 1: Client & Branding */}
            {activeTab === "client" && (
              <div className="glass-panel p-6 flex flex-col gap-5">
                <h3 className="text-base font-semibold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" /> Client & Branding Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-300">Client Name *</label>
                    <input
                      type="text"
                      required
                      placeholder={`e.g. ${DEFAULT_CONFIG.clientName}`}
                      value={config.clientName}
                      onChange={(e) => setConfig({ ...config, clientName: e.target.value })}
                      className="w-full mt-1 bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-300">Platform / Demo Name *</label>
                    <input
                      type="text"
                      required
                      placeholder={`e.g. ${DEFAULT_CONFIG.platformName}`}
                      value={config.platformName}
                      onChange={(e) => setConfig({ ...config, platformName: e.target.value })}
                      className="w-full mt-1 bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300">Tagline / Slogan *</label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. ${DEFAULT_CONFIG.tagline}`}
                    value={config.tagline}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    className="w-full mt-1 bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Client Logo Upload & Preview Section */}
                <div className="border-t border-gray-800 pt-4 flex flex-col gap-3">
                  <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                    <span>Import Client Logo *</span>
                    <span className="text-[10px] text-blue-400 font-normal">PNG, SVG, JPG, WebP supported</span>
                  </label>

                  <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
                    <div className="w-24 h-24 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center p-2 relative group overflow-hidden shrink-0">
                      {config.branding.logo ? (
                        <img
                          src={config.branding.logo}
                          alt="Client Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2">
                          <Upload className="w-4 h-4" /> Import Logo File
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoFileUpload(file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {config.branding.logo && (
                          <button
                            type="button"
                            onClick={() => updateBranding("logo", "")}
                            className="text-xs text-gray-400 hover:text-gray-200 px-3 py-2"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        This imported logo will be dynamically placed in the topbar header, footer, and hero banner across the entire generated website alongside <b>{config.clientName}</b> and <b>{config.platformName}</b>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Brand Colors */}
                <div className="border-t border-gray-800 pt-4">
                  <label className="text-xs font-semibold text-gray-300 block mb-3">Brand Color Palette</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
                      <input
                        type="color"
                        value={config.branding.primaryColor}
                        onChange={(e) => updateBranding("primaryColor", e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <div>
                        <div className="text-xs text-gray-400">Primary Color</div>
                        <div className="text-xs font-mono font-bold text-white">{config.branding.primaryColor}</div>
                      </div>
                    </div>

                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
                      <input
                        type="color"
                        value={config.branding.secondaryColor}
                        onChange={(e) => updateBranding("secondaryColor", e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <div>
                        <div className="text-xs text-gray-400">Secondary Color</div>
                        <div className="text-xs font-mono font-bold text-white">{config.branding.secondaryColor}</div>
                      </div>
                    </div>

                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
                      <input
                        type="color"
                        value={config.branding.accentColor}
                        onChange={(e) => updateBranding("accentColor", e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <div>
                        <div className="text-xs text-gray-400">Accent Color</div>
                        <div className="text-xs font-mono font-bold text-white">{config.branding.accentColor}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Country & Geography */}
            {activeTab === "country" && (
              <div className="glass-panel p-6 flex flex-col gap-5">
                <h3 className="text-base font-semibold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" /> Geographic & Currency Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-300">Country Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Romania"
                      required
                      value={config.country.name}
                      onChange={(e) => {
                        updateCountry("name", e.target.value);
                        setConfig((prev) => ({
                          ...prev,
                          countryConfig: { ...prev.countryConfig, country: e.target.value }
                        }));
                      }}
                      className="w-full mt-1 bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-300">Country Code</label>
                    <input
                      type="text"
                      placeholder="e.g. RO"
                      value={config.country.code}
                      onChange={(e) => updateCountry("code", e.target.value.toUpperCase())}
                      className="w-full mt-1 bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-300">Currency Symbol</label>
                    <input
                      type="text"
                      placeholder="e.g. RON"
                      value={config.country.symbol}
                      onChange={(e) => updateCountry("symbol", e.target.value)}
                      className="w-full mt-1 bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300">Regions (comma-separated) *</label>
                  <input
                    type="text"
                    required
                      value={rawRegions}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawRegions(val);
                      const arr = val.split(",").map((s) => s.trim()).filter(Boolean);
                      setConfig((prev) => ({
                        ...prev,
                        countryConfig: { ...prev.countryConfig, regions: arr }
                      }));
                    }}
                    placeholder="e.g. Bucharest, Transylvania, Moldavia, Banat"
                    className="w-full mt-1 bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300">Branches (comma-separated) *</label>
                  <input
                    type="text"
                    required
                      value={rawBranches}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawBranches(val);
                      const arr = val.split(",").map((s) => s.trim()).filter(Boolean);
                      setConfig((prev) => ({
                        ...prev,
                        countryConfig: { ...prev.countryConfig, branches: arr }
                      }));
                    }}
                    placeholder="e.g. Bucharest Central, Cluj-Napoca, Timișoara, Iași"
                    className="w-full mt-1 bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeTab === "homepage" && (
              <div className="glass-panel p-6 flex flex-col gap-5">
                <h3 className="text-base font-semibold text-white border-b border-gray-800 pb-3">Homepage</h3>
                <label className="text-sm text-gray-300">Hero title *
                  <input required placeholder={`e.g. ${DEFAULT_CONFIG.homepage.title}`} value={config.homepage.title} onChange={e => setConfig(prev => ({ ...prev, homepage: { ...prev.homepage, title: e.target.value } }))} className="w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                </label>
                <label className="text-sm text-gray-300">Hero description *
                  <textarea required placeholder={`e.g. ${DEFAULT_CONFIG.homepage.description}`} rows={4} value={config.homepage.description} onChange={e => setConfig(prev => ({ ...prev, homepage: { ...prev.homepage, description: e.target.value } }))} className="w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                </label>
                <div className="flex flex-col items-start gap-3">
                  <span className="text-sm text-gray-300">Hero background image</span>
                  <label className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Import Hero Image File
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setConfig(prev => ({ ...prev, homepage: { ...prev.homepage, heroImage: reader.result as string } }));
                      reader.readAsDataURL(file);
                    }
                    e.target.value = "";
                  }} />
                </label>
                </div>
                <p className="text-xs text-gray-400">Upload an image to replace the homepage background. Wide images work best.</p>
                {config.homepage.heroImage && <>
                  <img src={config.homepage.heroImage} alt="Homepage background preview" className="w-full max-h-64 object-contain rounded-lg bg-gray-950" />
                  <button type="button" onClick={() => setConfig(prev => ({ ...prev, homepage: { ...prev.homepage, heroImage: "" } }))} className="text-sm text-blue-400 self-start">Use template image</button>
                </>}
              </div>
            )}

            {/* TAB 4: Campaigns */}
            {activeTab === "campaigns" && (
              <div className="glass-panel p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-400" /> Campaign Management
                  </h3>
                  <button
                    onClick={addCampaign}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow"
                  >
                    <Plus className="w-4 h-4" /> Add Campaign
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {config.campaigns.map((camp, idx) => (
                    <div key={camp.id || idx} className="bg-gray-950/80 p-5 rounded-xl border border-gray-800 flex flex-col gap-4 relative">
                      <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
                        <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                          <Megaphone className="w-3.5 h-3.5" /> Campaign #{idx + 1}
                        </span>
                        {config.campaigns.length > 1 && (
                          <button
                            onClick={() => removeCampaign(idx)}
                            className="text-gray-500 hover:text-red-400 transition p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Campaign Image Upload & Preview */}
                        <div className="md:col-span-4 flex flex-col gap-2">
                          <label className="text-xs font-medium text-gray-300">Campaign Image</label>
                          <div className="w-full h-32 rounded-xl bg-gray-900 border border-gray-700 overflow-hidden relative group flex items-center justify-center">
                            {camp.img?.startsWith("data:") ? (
                              <img src={camp.img} alt={camp.name || "Campaign image preview"} className="w-full h-full object-contain" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-gray-400">
                                <div className="rounded-2xl bg-blue-500/10 p-3 ring-1 ring-blue-500/20">
                                  <ImagePlus aria-hidden="true" className="w-7 h-7 text-blue-400" />
                                </div>
                                <span className="text-xs">Upload a campaign image</span>
                              </div>
                            )}
                          </div>
                          <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium px-3 py-2 rounded-lg transition text-center flex items-center justify-center gap-1.5 border border-gray-700">
                            <Upload className="w-3.5 h-3.5 text-blue-400" /> Upload Image File
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCampaignImageUpload(idx, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {camp.img?.startsWith("data:") && (
                            <button type="button" onClick={() => setImageEditor({ id: camp.id, source: camp.img })} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-400 hover:bg-blue-500/20 transition"><Move aria-hidden="true" className="w-3.5 h-3.5" /> Adjust image</button>
                          )}
                        </div>

                        {/* Campaign Details Form */}
                        <div className="md:col-span-8 flex flex-col gap-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-400">Campaign Title</label>
                              <input
                                type="text"
                                placeholder="e.g. Summer Sales Challenge"
                                value={camp.name}
                                onChange={(e) => updateCampaign(idx, "name", e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-400">Incentive Type</label>
                              <input
                                type="text"
                                placeholder="e.g. Hit & Win Incentive"
                                value={camp.type}
                                onChange={(e) => updateCampaign(idx, "type", e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-400">Short Description / Blurb</label>
                              <input
                                type="text"
                                placeholder="e.g. Earn bonus rewards on qualifying purchases."
                                value={camp.blurb}
                                onChange={(e) => updateCampaign(idx, "blurb", e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-400">Status / Callout Text</label>
                              <input
                                type="text"
                                value={camp.status || ""}
                                onChange={(e) => updateCampaign(idx, "status", e.target.value)}
                                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                placeholder="e.g. Active, 240 RON earned"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p id="generation-requirements" aria-live="polite" className="text-xs text-gray-400">
              {canGenerate
                ? "All required fields are complete. Ready to generate your demo."
                : `Required before generating: ${missingFields.join(", ")}. Complete these in Client & Branding, Homepage, and Country & Geography. Fields marked * are required.`}
            </p>

            {/* Action Bar */}
            <div className="flex items-center justify-between bg-gray-950 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-400">
                Configured: <b className="text-white">{config.clientName}</b> ({config.platformName}) · {config.country.name}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerate}
                aria-describedby="generation-requirements"
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition shadow-xl shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Generating Demo...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" /> Generate Client Demo
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Preview & Progress Column (Right - 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
            {/* Live Brand Theme Preview Card */}
            <div className="glass-panel p-5 border-gray-800">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Live Brand Preview</h4>

              <div
                className="p-4 rounded-xl border flex flex-col gap-3 transition-all"
                style={{
                  backgroundColor: config.branding.secondaryColor || "#000000",
                  borderColor: "rgba(255,255,255,0.15)"
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {config.branding.logo && (
                      <img src={config.branding.logo} alt="Logo" className="max-h-7 max-w-[60px] object-contain shrink-0" />
                    )}
                    <div className="font-bold text-white text-sm truncate">
                      {config.clientName} <span className="text-xs font-normal opacity-70">{config.platformName}</span>
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: config.branding.accentColor, color: "#000000" }}
                  >
                    {config.country.symbol} Active
                  </span>
                </div>

                {config.campaigns[0] && (
                  <div
                    className="p-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 overflow-hidden"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}
                  >
                    {config.campaigns[0].img?.startsWith("data:") ? (
                      <img src={config.campaigns[0].img} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <ImagePlus aria-hidden="true" className="w-10 h-10 rounded bg-white/10 p-2 text-blue-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold">{config.campaigns[0].name}</div>
                      <div className="text-[10px] opacity-70 truncate">{config.campaigns[0].type}</div>
                    </div>
                    <span style={{ color: config.branding.accentColor }}>→</span>
                  </div>
                )}
              </div>
            </div>

            {/* Generation Log / Status */}
            <div className="glass-panel p-5 border-gray-800 flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Generation Execution Log</span>
                {result && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    PASSED
                  </span>
                )}
              </h4>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-900 font-mono text-[11px] h-52 overflow-y-auto flex flex-col gap-1.5 text-gray-300">
                {genLogs.length === 0 ? (
                  <span className="text-gray-600 italic">Click "Generate Client Demo" to start agentic workflow...</span>
                ) : (
                  genLogs.map((log, i) => (
                    <div key={i} className="leading-tight">
                      <span className="text-blue-400">›</span> {log}
                    </div>
                  ))
                )}
              </div>

              {/* Result Actions */}
              {result && (
                <div className="flex flex-col gap-2.5 mt-2 animate-in fade-in duration-300">
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition shadow flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Preview Generated Demo
                  </button>

                  <a
                    href={result.downloadUrl}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition shadow flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Production ZIP
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {imageEditor && (
        <CampaignImageEditor
          source={imageEditor.source}
          onClose={() => setImageEditor(null)}
          onSave={(image) => {
            setConfig(prev => ({ ...prev, campaigns: prev.campaigns.map(camp =>
              camp.id === imageEditor.id ? { ...camp, img: image, tileImage: image, heroImage: image } : camp
            ) }));
            setImageEditor(null);
          }}
        />
      )}

      {/* Embedded Live Preview Modal */}
      {result && (
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          previewUrl={result.previewUrl}
          downloadUrl={result.downloadUrl}
          clientName={config.clientName}
          platformName={config.platformName}
        />
      )}
    </div>
  );
}
