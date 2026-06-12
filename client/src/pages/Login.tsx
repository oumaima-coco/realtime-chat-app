import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Zap, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NETWORK_ERROR = "Cannot reach the server. Is the backend running?";
const GENERIC_ERROR = "Login failed. Please try again.";

function extractErrorMessage(err: unknown): string {
  if (typeof err !== "object" || err === null) return GENERIC_ERROR;
  const e = err as {
    response?: { data?: { error?: string } };
    code?: string;
    message?: string;
  };
  if (typeof e.response?.data?.error === "string") return e.response.data.error;
  if (e.code === "ERR_NETWORK" || e.message === "Network Error") return NETWORK_ERROR;
  return GENERIC_ERROR;
}

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate("/chat");
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cream">
      {/* ===== LEFT PANEL ===== */}
      <div className="hidden lg:flex flex-col bg-coral text-white p-12 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        {/* Logo at top */}
        <div className="relative z-10 flex items-center gap-3 mb-auto">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">Realtime Chat</span>
        </div>

        {/* Centered hero content */}
        <div className="relative z-10 my-auto space-y-6 max-w-lg">
          <h1 className="text-6xl font-bold leading-tight tracking-tight">
            Welcome<br />back.
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Pick up where you left off. Your rooms, history, and conversations are waiting for you.
          </p>
        </div>

        {/* Feature highlights at bottom */}
        <div className="relative z-10 mt-auto grid grid-cols-1 gap-4 max-w-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Instant messaging</div>
              <div className="text-sm text-white/70">WebSocket-powered, no refresh needed</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Multi-room conversations</div>
              <div className="text-sm text-white/70">Create channels, invite friends</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Presence & typing</div>
              <div className="text-sm text-white/70">See who's online, who's typing live</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile-only logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-coral rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Realtime Chat</span>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-3">Log in</h2>
            <p className="text-textMuted text-lg">Sign in to continue to your rooms.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {errorMessage && (
              <div className="bg-rustSoft text-rust border border-rust rounded-md px-4 py-3 text-sm font-semibold">
                {errorMessage}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} size="lg" className="mt-3 h-12 text-base">
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-8 text-base text-textMuted text-center">
            New here?{" "}
            <Link to="/register" className="text-coral font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;