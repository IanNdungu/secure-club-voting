
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ElectionProvider } from "./contexts/ElectionContext";
import Navbar from "./components/Navbar";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Elections from "./pages/Elections";
import ElectionPage from "./pages/ElectionPage";
import ElectionResultsPage from "./pages/ElectionResultsPage";
import CreateElection from "./pages/CreateElection";
import Admin from "./pages/Admin";
import ProfilePage from "./pages/ProfilePage";
import Home from "./pages/Home";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ElectionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 bg-slate-50">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/elections" element={<Elections />} />
                  <Route path="/elections/:id" element={<ElectionPage />} />
                  <Route path="/elections/:id/results" element={<ElectionResultsPage />} />
                  <Route path="/elections/create" element={<CreateElection />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <footer className="py-4 border-t bg-white">
                <div className="container text-center text-sm text-muted-foreground">
                  <p>© {new Date().getFullYear()} SecureClubVote. All votes are encrypted and anonymous.</p>
                </div>
              </footer>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ElectionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
