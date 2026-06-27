import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { HistoryProvider } from "@/hooks/use-history";
import { BibleProvider } from "@/components/BibleProvider";
import { ThemeProfileSync } from "@/components/ThemeProfileSync";
import Index from "./pages/Index.tsx";

const queryClient = new QueryClient();
const About = lazy(() => import("./pages/About.tsx"));
const Analytics = lazy(() => import("./pages/Analytics.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ThemeProfileSync />
            <BibleProvider>
              <HistoryProvider>
                <Suspense fallback={<div className="app-shell p-4 text-sm text-muted-foreground">Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </HistoryProvider>
            </BibleProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
