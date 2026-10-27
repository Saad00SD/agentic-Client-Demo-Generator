"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Paperclip, Plus, SlidersHorizontal, X, LoaderCircle, Download, ExternalLink } from "lucide-react";
import Dashboard from "./Dashboard";
import { ClientConfig, GenerationResult } from "../types";

type Attachment = { target: string; name: string; data: string };
type Session = {
  id: string; config: ClientConfig;
  messages: { role: "user" | "assistant"; content: string }[];
  result: (GenerationResult & { executionLog?: string[] }) | null;
  dirty: boolean;
};
const STORAGE_KEY = "demo-generator-v3-conversation";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/conversations${path}`, {
    ...options, headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "The request failed. Please retry.");
  return data as T;
}

export default function ChatWorkspace() {
  const [session, setSession] = useState<Session | null>(null);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [target, setTarget] = useState("logo");
  const [busy, setBusy] = useState("Loading your workspace…");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [mobile, setMobile] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptSession = (value: Session) => {
    setSession(value);
    localStorage.setItem(STORAGE_KEY, value.id);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        let value: Session;
        if (saved) {
          const response = await fetch(`/api/conversations/${encodeURIComponent(saved)}`);
          if (response.status === 404) value = await request<Session>("", { method: "POST" });
          else if (!response.ok) throw new Error("Could not restore your conversation. Refresh to retry.");
          else value = await response.json();
        } else value = await request<Session>("", { method: "POST" });
        if (!cancelled) acceptSession(value);
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load workspace."); }
      finally { if (!cancelled) setBusy(""); }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [session?.messages.length, busy]);

  async function send() {
    if (!session || busy || (!text.trim() && !attachments.length)) return;
    setBusy("Thinking, updating your brief, and building if requested…"); setError("");
    try {
      acceptSession(await request<Session>(`/${session.id}/messages`, {
        method: "POST", body: JSON.stringify({ message: text, attachments }),
      }));
      setText(""); setAttachments([]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send message."); }
    finally { setBusy(""); }
  }

  async function generate(config?: ClientConfig): Promise<GenerationResult> {
    if (!session) throw new Error("Create a conversation first.");
    setBusy("Building pages, validating assets, and preparing your ZIP…"); setError("");
    try {
      if (config) acceptSession(await request<Session>(`/${session.id}/config`, { method: "PUT", body: JSON.stringify({ clientConfig: config }) }));
      const updated = await request<Session>(`/${session.id}/generate`, { method: "POST" });
      acceptSession(updated);
      return updated.result!;
    } finally { setBusy(""); }
  }

  async function attach(file: File) {
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choose a PNG, JPEG, WebP or SVG image up to 5 MB."); return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachments(previous => [...previous.filter(a => a.target !== target), { target, name: file.name, data: String(reader.result) }].slice(-5));
    reader.onerror = () => setError("Could not read that image. Please retry.");
    reader.readAsDataURL(file);
  }

  if (editing && session) return <Dashboard initialConfig={session.config} assetBaseUrl={session.result?.previewUrl.replace(/index\.html$/, "")} onGenerate={generate} onSave={async config => {
    acceptSession(await request<Session>(`/${session.id}/config`, { method: "PUT", body: JSON.stringify({ clientConfig: config }) }));
    setEditing(false);
  }} />;

  const config = session?.config;
  const canBuild = !!(config?.clientName.trim() && config.platformName.trim() && config.country.name.trim());
  return <div className="min-h-screen bg-gray-950 text-gray-100">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 px-5 py-4">
      <div className="flex items-center gap-3"><Bot className="text-blue-400" /><div><h1 className="font-semibold">Demo Studio <span className="ml-2 text-xs text-blue-300">v3.0</span></h1><p className="text-xs text-gray-400">A conversation to a client-ready demo</p></div></div>
      <div className="flex gap-2">
        {session?.result && <button disabled={!!busy} onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm disabled:opacity-50"><SlidersHorizontal size={16} /> Edit details</button>}
        <button disabled={!!busy} onClick={async () => {
          setBusy("Starting a new demo…"); setError("");
          try { acceptSession(await request<Session>("", { method: "POST" })); setText(""); setAttachments([]); }
          catch (e) { setError(e instanceof Error ? e.message : "Could not start a demo."); }
          finally { setBusy(""); }
        }} className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm disabled:opacity-50"><Plus size={16} /> New demo</button>
      </div>
    </header>
    <main className="mx-auto grid max-w-[1700px] gap-5 p-4 lg:grid-cols-[minmax(350px,440px)_1fr] lg:p-6">
      <section aria-label="Demo conversation" className="flex min-h-[650px] flex-col rounded-2xl border border-gray-800 bg-gray-900/50 lg:h-[calc(100vh-135px)]">
        <div className="border-b border-gray-800 p-4"><h2 className="font-medium">Your demo brief</h2><p className="mt-1 text-xs text-gray-400">Tell me about your client. Refine anything as we go.</p></div>
        <div role="log" aria-live="polite" className="flex-1 space-y-4 overflow-y-auto p-4">
          {session?.messages.map((m, index) => <div key={index} className={`whitespace-pre-wrap break-words rounded-xl p-3 text-sm leading-6 ${m.role === "user" ? "ml-7 bg-blue-600/20" : "mr-4 bg-gray-800/70"}`}><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">{m.role === "user" ? "You" : "Demo agent"}</span>{m.content}</div>)}
          {busy && <p role="status" className="flex items-center gap-2 text-sm text-blue-300"><LoaderCircle size={16} className="shrink-0 animate-spin" />{busy}</p>}
          <div ref={endRef} />
        </div>
        <form onSubmit={e => { e.preventDefault(); void send(); }} className="border-t border-gray-800 p-4">
          {error && <p role="alert" className="mb-3 rounded-lg bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
          {!!attachments.length && <div className="mb-3 flex flex-wrap gap-2">{attachments.map(a => <span key={a.target} className="flex max-w-full items-center gap-2 rounded-lg bg-gray-800 p-2 text-xs"><img src={a.data} alt="" className="h-8 w-8 rounded object-contain" /><span className="truncate">{a.name} · {a.target}</span><button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAttachments(p => p.filter(v => v !== a))}><X size={14} /></button></span>)}</div>}
          <textarea aria-label="Message to demo agent" value={text} onChange={e => setText(e.target.value)} disabled={!!busy || !session} maxLength={12000} rows={3} placeholder="e.g. Build a rewards demo for BMW in Germany, called Drive…" className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950 p-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select aria-label="Image purpose" value={target} onChange={e => setTarget(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-950 p-2 text-xs"><option value="logo">Client logo</option><option value="hero">Homepage image</option>{config?.campaigns.map((c, i) => <option key={c.id} value={`campaign_${i}`}>{c.name} image</option>)}</select>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void attach(f); e.target.value = ""; }} />
            <button type="button" aria-label="Attach image" disabled={!!busy || !session} onClick={() => fileRef.current?.click()} className="rounded-lg border border-gray-700 p-2 disabled:opacity-50"><Paperclip size={18} /></button>
            <button type="submit" aria-label="Send message" disabled={!!busy || !session || (!text.trim() && !attachments.length)} className="rounded-lg bg-blue-600 p-2 disabled:opacity-40"><Send size={18} /></button>
          </div><p className="mt-2 text-[11px] text-gray-500">Images are applied to your demo. Describe them in chat for design guidance.</p>
        </form>
      </section>
      <section className="flex min-w-0 flex-col gap-4">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-blue-300">Client workspace</p><h2 className="mt-1 text-xl font-semibold">{config?.clientName || "Your next client demo"}{config?.platformName ? ` / ${config.platformName}` : ""}</h2></div>
            <button disabled={!canBuild || !!busy || !!attachments.length} onClick={() => { void generate().catch(e => setError(e instanceof Error ? e.message : "Build failed.")); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium disabled:opacity-40">{session?.result ? "Rebuild demo" : "Generate demo"}</button></div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-300"><span className="rounded-full bg-gray-800 px-3 py-1">{config?.country.name || "Country to be confirmed"}</span><span className="rounded-full bg-gray-800 px-3 py-1">{config?.campaigns.length || 0} campaigns</span>{config && [config.branding.primaryColor, config.branding.accentColor].map((color, i) => <span key={i} className="h-6 w-6 rounded-full border border-gray-600" style={{ backgroundColor: /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#333" }} title={color} />)}</div>
          {session?.result && session.dirty && <p className="mt-3 text-xs text-amber-300">Details have changed. Rebuild to update the preview.</p>}
          {!!attachments.length && <p className="mt-3 text-xs text-amber-300">Send your attached images before generating.</p>}
        </div>
        {session?.result ? <>
          <div className="flex flex-wrap items-center gap-3 text-xs"><button onClick={() => setMobile(v => !v)} className="rounded-lg border border-gray-700 px-3 py-2">{mobile ? "Desktop preview" : "Mobile preview"}</button><a href={session.result.previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1"><ExternalLink size={14} /> Open preview</a><a href={session.result.downloadUrl} className="flex items-center gap-1 text-emerald-300"><Download size={14} /> Download ZIP</a></div>
          {session.result.validation?.valid === false && <div role="alert" className="rounded-lg border border-amber-800 p-3 text-sm text-amber-200">Validation issues: {session.result.validation.errors.join("; ")}</div>}
          <iframe key={session.result.projectId} src={session.result.previewUrl} title="Generated client demo" className={`min-h-[600px] flex-1 self-center rounded-xl border border-gray-700 bg-white ${mobile ? "w-full max-w-[390px]" : "w-full"}`} />
          <details className="rounded-xl border border-gray-800 p-4 text-xs text-gray-400"><summary className="cursor-pointer">Generation steps and validation</summary><ol className="mt-3 space-y-1">{session.result.executionLog?.map((step, i) => <li key={i}>{i + 1}. {step}</li>)}</ol>{session.result.validation?.warnings.map((warning, i) => <p className="mt-2 text-amber-300" key={i}>{warning}</p>)}{session.result.traceId && <p className="mt-3 break-all">LangSmith build trace: <code className="select-all">{session.result.traceId}</code></p>}<p className="mt-2 break-all">Conversation: <code className="select-all">{session.id}</code></p></details>
          <div className="rounded-xl border border-gray-800 p-4 text-sm"><h3 className="font-semibold">Demo details</h3><p className="mt-2 text-gray-400">{config?.tagline}</p><p className="mt-1 text-gray-400">{config?.homepage.title}</p><p className="mt-1 text-gray-400">{config?.country.name} · {config?.country.currency} · {config?.languages.map(l => l.label).join(", ")}</p><button disabled={!!busy} onClick={() => setEditing(true)} className="mt-3 text-blue-300">Edit branding, geography, homepage and campaigns →</button></div>
        </> : <div className="flex min-h-[450px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 p-8 text-center"><Bot size={40} className="mb-4 text-blue-400" /><h2 className="text-xl font-medium">Start with a conversation</h2><p className="mt-3 max-w-md text-sm leading-6 text-gray-400">Share your client, country, branding and campaign ideas. The agent will gather the details and build a demo you can preview and edit here.</p><p className="mt-5 max-w-md text-xs text-gray-500">Your conversation and images are saved on this server. This browser resumes your latest demo.</p></div>}
      </section>
    </main>
  </div>;
}
