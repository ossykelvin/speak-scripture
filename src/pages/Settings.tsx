import { ArrowLeft, BookOpen, ExternalLink, LibraryBig } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useBibleProvider } from "@/hooks/use-bible-provider";
import type { BibleProviderId } from "@/lib/bible";

const PROVIDERS: Array<{
  id: BibleProviderId;
  title: string;
  description: string;
  icon: typeof BookOpen;
}> = [
  {
    id: "helloao",
    title: "HelloAO",
    description: "More translations and access to commentaries and Bible datasets.",
    icon: LibraryBig,
  },
  {
    id: "legacy",
    title: "Bible API",
    description: "The original Bible API used by Speak Scripture.",
    icon: BookOpen,
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { provider, setProvider } = useBibleProvider();

  return (
    <main className="app-shell mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-6 sm:px-5">
      <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="mb-6">
        <h1 className="font-serif text-xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose where Bible text and translations come from.</p>
      </header>

      <section className="space-y-3" aria-labelledby="provider-heading">
        <h2 id="provider-heading" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Bible provider
        </h2>
        <RadioGroup value={provider} onValueChange={(value) => setProvider(value as BibleProviderId)} className="space-y-3">
          {PROVIDERS.map(({ id, title, description, icon: Icon }) => (
            <Label
              key={id}
              htmlFor={`provider-${id}`}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                provider === id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">{description}</span>
              </span>
              <RadioGroupItem id={`provider-${id}`} value={id} aria-label={title} className="mt-1" />
            </Label>
          ))}
        </RadioGroup>
        <p className="text-xs text-muted-foreground">The setting is saved on this device and applies to new searches.</p>
      </section>

      <Button type="button" variant="outline" className="mt-8" onClick={() => navigate("/about")}>
        About Speak Scripture <ExternalLink className="h-4 w-4" />
      </Button>
    </main>
  );
}
