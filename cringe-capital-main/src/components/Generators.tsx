import { useState } from "react";
import { GeneratorCard } from "./GeneratorCard";
import { generateStartup, generatePitch, generateLinkedInPost, generateMission, generateJobTitle, generateRejection, SIMULATOR_OUTCOMES, type Startup, type Pitch, type LinkedInPost, type Mode } from "@/lib/generators";
import { sfx } from "@/lib/sound";
import { Rocket, Linkedin, LineChart, Quote, Briefcase, Dice5, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props { mode: Mode }

function copy(text: string) {
  navigator.clipboard?.writeText(text);
  toast.success("Copied. Now go ruin a group chat. 📤");
}

const fakeDelay = (cb: () => void, sound: () => void) => {
  sound();
  setTimeout(cb, 650);
};

export function StartupGenerator({ mode }: Props) {
  const [data, setData] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <GeneratorCard
      icon={<Rocket className="size-5" />}
      title="Startup Idea Generator"
      subtitle="Series A energy, Series Z substance"
      ctaLabel="Generate Startup"
      loading={loading}
      onGenerate={() => {
        setLoading(true);
        fakeDelay(() => { setData(generateStartup(mode)); setLoading(false); sfx.reveal(); }, sfx.generate);
      }}
    >
      {data && (
        <div className="space-y-3" style={{ animation: "rise 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)" }}>
          <div className="flex items-center justify-between">
            <div className="font-display text-2xl font-bold tracking-tight">{data.name}</div>
            <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{data.status}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{data.mission}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Funding" value={data.funding} />
            <Stat label="Valuation" value={data.valuation} />
          </div>
          <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-3 text-sm italic">"{data.tagline}"</div>
          <p className="text-xs text-muted-foreground">{data.investors}</p>
          <ShareRow text={`🚀 ${data.name} — ${data.tagline}\n${data.mission}\n${data.funding} • ${data.valuation}`} />
        </div>
      )}
    </GeneratorCard>
  );
}

export function LinkedInGenerator(_: Props) {
  const [data, setData] = useState<LinkedInPost | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <GeneratorCard
      icon={<Linkedin className="size-5" />}
      title="LinkedIn Cringe Generator"
      subtitle="Thought leadership without the leadership"
      ctaLabel="Generate Post"
      accent="navy"
      loading={loading}
      onGenerate={() => {
        setLoading(true);
        fakeDelay(() => { setData(generateLinkedInPost()); setLoading(false); sfx.reveal(); }, sfx.typing);
      }}
    >
      {data && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card" style={{ animation: "rise 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)" }}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-neon font-bold text-neon-foreground">
              {data.author.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {data.author}
                <span className="rounded bg-neon/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon">Thought Leader</span>
              </div>
              <div className="truncate text-xs text-muted-foreground">{data.title} • 2h</div>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold leading-snug">{data.hook}</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{data.body}</p>
          <p className="mt-2 text-sm font-semibold">"{data.lesson}"</p>
          <p className="mt-2 break-words text-xs text-neon">{data.hashtags}</p>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
            <span>👍🔥💯 {data.likes.toLocaleString()}</span>
            <span>{data.comments} comments • {data.reposts} reposts</span>
          </div>
          <ShareRow text={`${data.hook}\n\n${data.body}\n\n"${data.lesson}"\n\n${data.hashtags}`} linkedin />
        </div>
      )}
    </GeneratorCard>
  );
}

export function PitchGenerator(_: Props) {
  const [data, setData] = useState<Pitch | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <GeneratorCard
      icon={<LineChart className="size-5" />}
      title="Investor Pitch Creator"
      subtitle="Pre-revenue, post-shame"
      ctaLabel="Generate Pitch"
      loading={loading}
      onGenerate={() => {
        setLoading(true);
        fakeDelay(() => { setData(generatePitch()); setLoading(false); sfx.cash(); }, sfx.generate);
      }}
    >
      {data && (
        <div className="space-y-2 text-sm" style={{ animation: "rise 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)" }}>
          <Row label="Product" value={data.product} />
          <Row label="Problem" value={data.problem} />
          <Row label="Solution" value={data.solution} />
          <Row label="Market" value={data.market} />
          <Row label="Revenue" value={data.revenue} />
          <Row label="The Ask" value={data.ask} highlight />
          <ShareRow text={`PITCH: ${data.product}\nProblem: ${data.problem}\nSolution: ${data.solution}\nMarket: ${data.market}\n${data.ask}`} />
        </div>
      )}
    </GeneratorCard>
  );
}

export function MissionGenerator({ mode }: Props) {
  const [text, setText] = useState<string | null>(null);
  return (
    <GeneratorCard
      icon={<Quote className="size-5" />}
      title="Corporate Mission Statement"
      subtitle="Means absolutely nothing. Beautifully."
      ctaLabel="Generate Mission"
      onGenerate={() => { sfx.generate(); setTimeout(() => { setText(generateMission(mode)); sfx.reveal(); }, 400); }}
    >
      {text && (
        <blockquote className="rounded-xl border-l-4 border-neon bg-secondary/60 p-4 font-display text-base italic leading-snug" style={{ animation: "rise 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)" }}>
          "{text}"
          <ShareRow text={`Our mission: ${text}`} />
        </blockquote>
      )}
    </GeneratorCard>
  );
}

export function JobTitleGenerator(_: Props) {
  const [titles, setTitles] = useState<string[]>([]);
  return (
    <GeneratorCard
      icon={<Briefcase className="size-5" />}
      title="AI Job Title Generator"
      subtitle="LinkedIn bio, energized"
      ctaLabel="Generate Titles"
      onGenerate={() => { sfx.click(); setTitles(Array.from({ length: 4 }, generateJobTitle)); }}
    >
      {titles.length > 0 && (
        <ul className="space-y-2" style={{ animation: "rise 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)" }}>
          {titles.map((t, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold">
              <span>{t}</span>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => copy(t)}>Copy</Button>
            </li>
          ))}
        </ul>
      )}
    </GeneratorCard>
  );
}

export function FundingSimulator(_: Props) {
  const [outcome, setOutcome] = useState<typeof SIMULATOR_OUTCOMES[number] | null>(null);
  return (
    <GeneratorCard
      icon={<Dice5 className="size-5" />}
      title="Fake Funding Simulator"
      subtitle="What does the market think of you today?"
      ctaLabel="Roll Fate"
      accent="navy"
      onGenerate={() => {
        sfx.generate();
        setTimeout(() => {
          const o = SIMULATOR_OUTCOMES[Math.floor(Math.random() * SIMULATOR_OUTCOMES.length)];
          setOutcome(o);
          if (o.tone === "good") { sfx.applause(); sfx.cash(); }
          else if (o.tone === "bad") sfx.fail();
          else sfx.reveal();
        }, 500);
      }}
    >
      {outcome && (
        <div className="rounded-xl border border-border bg-card p-4" style={{ animation: "rise 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)" }}>
          <div className="text-4xl">{outcome.emoji}</div>
          <p className="mt-2 font-display text-lg font-bold leading-snug">{outcome.label}</p>
          <ShareRow text={`Update: ${outcome.label} ${outcome.emoji}`} />
        </div>
      )}
    </GeneratorCard>
  );
}

export function RejectionGenerator(_: Props) {
  const [text, setText] = useState<string | null>(null);
  return (
    <GeneratorCard
      icon={<MailX className="size-5" />}
      title="Investor Rejection Letters"
      subtitle="Brutal, but with manners"
      ctaLabel="Get Rejected"
      onGenerate={() => { sfx.fail(); setTimeout(() => setText(generateRejection()), 250); }}
    >
      {text && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 font-display italic" style={{ animation: "rise 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)" }}>
          "{text}"
          <ShareRow text={`Got this rejection today: "${text}"`} />
        </div>
      )}
    </GeneratorCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-neon/40 bg-neon/5" : "border-border bg-card"}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 leading-snug">{value}</div>
    </div>
  );
}

function ShareRow({ text, linkedin }: { text: string; linkedin?: boolean }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => copy(text)}>📋 Copy</Button>
      {linkedin && (
        <Button size="sm" variant="outline" onClick={() => {
          const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://lovable.dev")}&summary=${encodeURIComponent(text)}`;
          window.open(url, "_blank");
        }}>Post on LinkedIn 😭</Button>
      )}
      <Button size="sm" variant="outline" onClick={() => {
        if (navigator.share) navigator.share({ text }).catch(() => copy(text));
        else copy(text);
      }}>📤 Share</Button>
    </div>
  );
}
