import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { MessageCircle, Zap, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NETWORK_ERROR = "Cannot reach the server. Is the backend running?";
const GENERIC_ERROR = "Registration failed. Please try again.";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

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

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parseResult = registerSchema.safeParse({ username, password });
    if (!parseResult.success) {
      setErrorMessage(parseResult.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(username, password);
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
            Join the<br />conversation.
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Create an account in seconds. No email required, no spam — just chat.
          </p>
        </div>

        <div className="relative z-10 mt-auto grid grid-cols-1 gap-4 max-w-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Real-time messaging</div>
              <div className="text-sm text-white/70">WebSockets, no polling, no delays</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Create your own rooms</div>
              <div className="text-sm text-white/70">Public channels, scoped to members</div>
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

      {/* ===== RIGHT PANEL ===== */}
      <div className="flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-coral rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Realtime Chat</span>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-3">Create an account</h2>
            <p className="text-textMuted text-lg">Pick a username. Pick a password. Start chatting.</p>
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
                autoComplete="new-password"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-8 text-base text-textMuted text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-coral font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;