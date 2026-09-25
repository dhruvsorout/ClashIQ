"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { RatingBadge, getRankTier } from "@/components/ui/RatingBadge";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { getUserStats, updateUserProfile } from "@/lib/api";
import type { UserStats } from "@/lib/types";
import {
  CheckIcon,
  CrossIcon,
  EditIcon,
  FlameIcon,
  ShieldIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/ui/Icons";

export default function ProfilePage() {
  const { user, token, isLoading: authLoading, updateUser } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(() => user?.username ?? "");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth");
    }
  }, [authLoading, token, router]);

  // Load user stats
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    getUserStats(token)
      .then((res) => {
        if (isMounted) setStats(res.stats);
      })
      .catch(() => {
        // Silently handle if stats unavailable
      })
      .finally(() => {
        if (isMounted) setStatsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newUsername.trim()) return;

    const trimmed = newUsername.trim();
    if (trimmed.length < 3) {
      setEditError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setEditError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    setIsSubmitting(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const res = await updateUserProfile(token, { username: trimmed });
      updateUser({ username: res.user.username });
      setEditSuccess("Username updated successfully.");
      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (!user && token)) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center font-mono text-xs text-[#94A3B8]">
        AUTHENTICATING PROFILE...
      </div>
    );
  }

  const currentRating = user?.rating ?? stats?.rating ?? 1000;
  const tier = getRankTier(currentRating);

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Profile Header Banner */}
        <section className="surface-card p-6 sm:p-8 mb-8 border-[#2E3A4E] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar Box */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1B2332] border-2 border-[#3B4B68] rounded flex items-center justify-center text-2xl sm:text-3xl font-mono font-bold text-[#FCD34D] shrink-0">
                {user?.username?.slice(0, 2).toUpperCase() ?? "ME"}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#F8FAFC]">
                    {user?.username}
                  </h1>
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tier.bg} ${tier.border} ${tier.color}`}>
                    {tier.name}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#94A3B8] font-mono">
                  {user?.email}
                </p>
                <div className="text-[11px] font-mono text-[#64748B] mt-1">
                  MEMBER ID: {user?.id}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
              <RatingBadge rating={currentRating} size="lg" />
              <button
                onClick={() => {
                  setNewUsername(user?.username ?? "");
                  setIsEditing(!isEditing);
                  setEditError(null);
                  setEditSuccess(null);
                }}
                className="btn btn-secondary text-xs py-2 px-4 font-mono flex items-center gap-2 self-start sm:self-end"
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>{isEditing ? "Cancel Editing" : "Edit Profile"}</span>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {editSuccess && (
            <div className="mt-6 p-3 bg-[#064E3B]/40 border border-[#059669] rounded text-xs text-[#6EE7B7] font-mono flex items-center gap-2">
              <CheckIcon className="w-4 h-4 shrink-0" />
              <span>{editSuccess}</span>
            </div>
          )}
          {editError && (
            <div className="mt-6 p-3 bg-[#7F1D1D]/40 border border-[#DC2626] rounded text-xs text-[#FCA5A5] font-mono flex items-center gap-2">
              <CrossIcon className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {/* Profile Edit Form */}
          {isEditing && (
            <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-[#222B3B]">
              <h3 className="font-display font-bold text-sm text-[#F8FAFC] mb-3">
                Update Display Handle
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="New username"
                  className="input-solid h-10 font-mono text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || newUsername === user?.username}
                  className="btn btn-primary text-xs py-2 px-5 font-mono font-bold shrink-0"
                >
                  {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
                </button>
              </div>
              <p className="text-[11px] font-mono text-[#64748B] mt-2">
                Usernames must be unique, 3-25 characters, alphanumeric and underscores only.
              </p>
            </form>
          )}
        </section>

        {/* ─── Competitive Performance Overview ─────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrophyIcon className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="font-display font-bold text-lg text-[#F8FAFC]">
              Career Performance Metrics
            </h2>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Games */}
              <div className="surface-card p-5 border-l-4 border-l-[#F59E0B]">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Total Matches
                  </span>
                  <UsersIcon className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <div className="font-mono font-bold text-3xl text-[#F8FAFC]">
                  {stats?.totalGames ?? 0}
                </div>
                <div className="text-[11px] text-[#64748B] font-mono mt-1">
                  1v1 Competitive Arena
                </div>
              </div>

              {/* Win/Loss Record */}
              <div className="surface-card p-5 border-l-4 border-l-[#10B981]">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Combat Record
                  </span>
                  <FlameIcon className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="font-mono font-bold text-3xl text-[#6EE7B7]">
                  {stats?.gamesWon ?? 0}W
                  <span className="text-lg text-[#94A3B8] font-normal ml-2">
                    {stats?.gamesLost ?? 0}L
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8] font-mono mt-1">
                  {stats?.winRate ?? 0}% Win Rate
                </div>
              </div>

              {/* Arithmetic Accuracy */}
              <div className="surface-card p-5 border-l-4 border-l-[#2563EB]">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Precision
                  </span>
                  <TargetIcon className="w-4 h-4 text-[#93C5FD]" />
                </div>
                <div className="font-mono font-bold text-3xl text-[#93C5FD]">
                  {stats?.accuracy ?? 0}%
                </div>
                <div className="text-[11px] text-[#94A3B8] font-mono mt-1">
                  {stats?.correctAnswers ?? 0} of {stats?.totalAnswers ?? 0} accurate
                </div>
              </div>

              {/* Rating Standing */}
              <div className="surface-card p-5 border-l-4 border-l-[#8B5CF6]">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Current Standing
                  </span>
                  <ShieldIcon className="w-4 h-4 text-[#C4B5FD]" />
                </div>
                <div className="font-mono font-bold text-3xl text-[#C4B5FD]">
                  {currentRating}
                </div>
                <div className="text-[11px] text-[#94A3B8] font-mono mt-1">
                  Tier: {tier.name}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="surface-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-base text-[#F8FAFC]">
              Ready for your next ranked challenge?
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Queue into the live matchmaking pool to challenge active competitors.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn btn-primary font-mono text-xs">
              Go to Dashboard
            </Link>
            <Link href="/friends" className="btn btn-secondary font-mono text-xs">
              View Friends
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
