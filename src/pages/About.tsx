import { BookOpen, Info, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/config";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="app-shell flex min-h-screen w-full min-w-0 max-w-lg flex-col mx-auto">
      <header className="flex items-center gap-3 px-5 pt-6 pb-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-serif text-lg font-semibold text-foreground tracking-wide">
          About
        </h1>
      </header>

      <div className="flex-1 px-6 py-8 space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-4 rounded-full bg-primary/10">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground">
            {appConfig.appName}
          </h2>
          <span className="text-xs font-medium uppercase tracking-wider bg-primary/15 text-primary px-2 py-1 rounded">
            v1.0.0
          </span>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Info className="h-4 w-4 text-primary" />
              What it does
            </div>
            <p className="leading-relaxed">
              {appConfig.appName} uses your device microphone to listen to live
              discussions, Bible studies, or sermons. It automatically detects
              Bible references mentioned and displays the full verse text in
              KJV.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-foreground font-medium">How to use</p>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed">
              <li>Tap the microphone to start listening</li>
              <li>Speak or play a discussion mentioning Bible verses</li>
              <li>References are detected and displayed with full text</li>
              <li>Tap the X button to stop listening</li>
            </ol>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-foreground font-medium">Details</p>
            <p>Version: <span className="text-foreground">KJV</span></p>
            <p>Audio: <span className="text-foreground">Device microphone</span></p>
            <p>Storage: <span className="text-foreground">{appConfig.storageProvider}</span></p>
          </div>

          <a
            href="/downloads/Speak-Scripture-v1.0-debug.apk"
            download
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Download Android APK
          </a>
          <p className="text-center text-xs">
            Android 7.0 or newer. You may need to allow installation from your browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
