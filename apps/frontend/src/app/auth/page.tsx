"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeftIcon,
  CrossIcon,
  EyeIcon,
  EyeOffIcon,
  SwordsIcon,
} from "@/components/ui/Icons";

type AuthTab = "login" | "register";

export default function AuthPage() {
  const { login, register } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setError(null);
  };

  const validateInputs = (): boolean => {
    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return false;
    }

    if (tab === "register") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return false;
      }
      if (!/[A-Z]/.test(password)) {
        setError("Password must contain at least one uppercase letter.");
        return false;
      }
      if (!/[0-9]/.test(password)) {
        setError("Password must contain at least one number.");
        return false;
      }
    } else {
      if (!password) {
        setError("Please enter your password.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2 mb-8 group focus-visible:outline-none">
        <div className="w-8 h-8 bg-[#2563EB] text-white flex items-center justify-center font-bold text-base rounded">
          <SwordsIcon className="w-5 h-5" />
        </div>
        <span className="font-display font-bold text-2xl tracking-tight text-[#F8FAFC]">
          Clash<span className="text-[#F59E0B]">IQ</span>
        </span>
      </Link>

      {/* Auth Card Container */}
      <div className="surface-card w-full max-w-md p-6 sm:p-8 border-[#2E3A4E]">
        {/* Tab Toggle */}
        <div className="grid grid-cols-2 bg-[#1B2332] border border-[#2A364C] p-1 rounded mb-6 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              resetForm();
            }}
            className={`py-2 font-bold rounded transition-colors ${
              tab === "login"
                ? "bg-[#2563EB] text-white"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              resetForm();
            }}
            className={`py-2 font-bold rounded transition-colors ${
              tab === "register"
                ? "bg-[#2563EB] text-white"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="font-display font-bold text-xl text-[#F8FAFC]">
            {tab === "login" ? "Enter the Arena" : "Create Competitor Account"}
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1 font-sans">
            {tab === "login"
              ? "Access your ranked profile, match history, and live matchmaking."
              : "Establish your starting 1000 Elo rating and join real-time arithmetic battles."}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-3 bg-[#7F1D1D]/40 border border-[#DC2626] rounded text-xs text-[#FCA5A5] font-mono flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-[#FCA5A5] hover:opacity-75"
              aria-label="Dismiss error"
            >
              <CrossIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="competitor@domain.com"
              required
              autoFocus
              className="input-solid h-11"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-solid h-11 pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {tab === "register" && (
              <p className="text-[11px] font-mono text-[#64748B] mt-1.5">
                Must be at least 8 characters with 1 uppercase letter and 1 number.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full h-11 text-sm font-mono font-bold mt-2"
          >
            {isLoading
              ? "AUTHENTICATING..."
              : tab === "login"
              ? "LOG IN TO ARENA"
              : "CREATE ACCOUNT & ENTER"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#222B3B] text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            <ArrowLeftIcon className="w-3 h-3" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
