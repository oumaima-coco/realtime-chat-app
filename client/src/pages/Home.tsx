import { Link, Navigate } from "react-router-dom";
import { MessageCircle, ArrowRight, Zap, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-textMuted">Loading…</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cream">
      {/* ===== LEFT PANEL — coral hero ===== */}
      <div className="hidden lg:flex flex-col bg-coral text-white p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-3 mb-auto">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">Realtime Chat</span>
        </div>

        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <h1 className="text-6xl font-bold leading-tight tracking-tight">
            Chat that<br />feels alive.
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Multi-room, real-time, with presence and typing indicators.
            Built from scratch to learn modern full-stack patterns.
          </p>
        </div>

        <div className="relative z-10 mt-auto grid grid-cols-1 gap-4 max-w-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">WebSockets via Socket.io</div>
              <div className="text-sm text-white/70">Push-based delivery, no polling</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Multi-room conversations</div>
              <div className="text-sm text-white/70">Per-room scoping, PostgreSQL persistence</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Production-grade security</div>
              <div className="text-sm text-white/70">JWT auth, rate limiting, XSS-safe</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — CTA ===== */}
      <div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile-only logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-coral rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Realtime Chat</span>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-bold mb-4">Get started</h2>
            <p className="text-textMuted text-lg leading-relaxed">
              Create an account to start chatting in real time, or log in to pick up where you left off.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/register" className="w-full">
              <Button size="lg" className="w-full h-12 text-base gap-2">
                Create an account
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login" className="w-full">
              <Button size="lg" variant="secondary" className="w-full h-12 text-base">
                I already have an account
              </Button>
            </Link>
          </div>

          <p className="mt-10 text-sm text-textSoft text-center">
            No email required. No spam. Just chat.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;