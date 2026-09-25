"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Navbar } from "@/components/layout/Navbar";
import { RatingBadge, getRankTier } from "@/components/ui/RatingBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import {
  getFriends,
  getFriendRequests,
  getUserById,
  sendFriendRequest,
} from "@/lib/api";
import type { PublicUser } from "@/lib/types";
import {
  ArrowLeftIcon,
  CheckIcon,
  ShieldIcon,
  SwordsIcon,
  TrophyIcon,
  UserCheckIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/ui/Icons";

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: currentUser, token, isLoading: authLoading } = useAuth();
  const {
    challengeFriend,
    outgoingChallenges,
    incomingChallenges,
    acceptChallenge,
  } = useWebSocket();
  const router = useRouter();

  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Friendship & Challenge states
  const [isFriend, setIsFriend] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isChallenging, setIsChallenging] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const isSelf = currentUser?.id === id;

  const handleChallenge = () => {
    if (!profileUser || isChallenging) return;
    setIsChallenging(true);
    challengeFriend(profileUser.id);
    setActionFeedback(`Challenge transmitted to ${profileUser.username}.`);
    setTimeout(() => {
      setIsChallenging(false);
    }, 3000);
  };

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth");
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    if (!token || !id) return;

    let isMounted = true;

    Promise.all([
      getUserById(token, id),
      getFriends(token).catch(() => ({ friends: [] })),
      getFriendRequests(token).catch(() => ({ requests: [] })),
    ])
      .then(([userRes, friendsRes, requestsRes]) => {
        if (!isMounted) return;
        setProfileUser(userRes.user);

        const friendMatch = friendsRes.friends?.some((f) => f.friend.id === id);
        setIsFriend(Boolean(friendMatch));

        const pendingMatch = requestsRes.requests?.some(
          (r) => r.sender.id === id || r.receiver.id === id
        );
        setIsPending(Boolean(pendingMatch));
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "User profile could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, id]);

  const handleSendFriendRequest = async () => {
    if (!token || !profileUser || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await sendFriendRequest(token, profileUser.id);
      setRequestSent(true);
      setActionFeedback("Friend request sent successfully.");
    } catch (err) {
      setActionFeedback(err instanceof Error ? err.message : "Failed to send request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center font-mono text-xs text-[#94A3B8]">
        AUTHENTICATING...
      </div>
    );
  }

  const rating = profileUser?.rating ?? 1000;
  const tier = getRankTier(rating);

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/friends"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Return to Community</span>
          </Link>
        </div>

        {loading ? (
          <div className="surface-card p-8 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error || !profileUser ? (
          <EmptyState
            icon={<UserIcon className="w-6 h-6 text-[#EF4444]" />}
            title="Competitor Not Found"
            description={error ?? "The competitor profile you are looking for does not exist or may have been removed."}
            action={
              <Link href="/friends" className="btn btn-secondary font-mono text-xs">
                Back to Search
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Action Feedback */}
            {actionFeedback && (
              <div className="p-3 bg-[#1B2332] border border-[#2A364C] rounded text-xs font-mono text-[#F8FAFC]">
                {actionFeedback}
              </div>
            )}

            {/* Profile Card */}
            <div className="surface-card p-6 sm:p-8 border-[#2E3A4E]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1B2332] border-2 border-[#3B4B68] rounded flex items-center justify-center text-2xl sm:text-3xl font-mono font-bold text-[#FCD34D] shrink-0">
                    {profileUser.username.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#F8FAFC]">
                        {profileUser.username}
                      </h1>
                      <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tier.bg} ${tier.border} ${tier.color}`}>
                        {tier.name}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#64748B]">
                      PUBLIC COMPETITOR RECORD
                    </div>
                  </div>
                </div>

                {/* Friendship & Interaction Actions */}
                <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                  <RatingBadge rating={rating} size="lg" />

                  <div className="mt-2">
                    {isSelf ? (
                      <Link
                        href="/profile"
                        className="btn btn-secondary text-xs py-2 px-4 font-mono"
                      >
                        Your Profile Settings
                      </Link>
                    ) : isFriend ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#6EE7B7] bg-[#064E3B] border border-[#059669] px-3 py-1.5 rounded">
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>FRIENDS</span>
                        </span>

                        {incomingChallenges.find((c) => c.challenger.id === id) ? (
                          <button
                            onClick={() => {
                              const match = incomingChallenges.find((c) => c.challenger.id === id);
                              if (match) acceptChallenge(match.id);
                            }}
                            className="btn btn-primary text-xs py-1.5 px-3.5 font-mono flex items-center gap-1.5"
                          >
                            <SwordsIcon className="w-3.5 h-3.5" />
                            <span>ACCEPT MATCH</span>
                          </button>
                        ) : outgoingChallenges.some((c) => c.challenged?.id === id) ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#F59E0B] bg-[#78350F]/50 border border-[#D97706] px-3 py-1.5 rounded">
                            <SwordsIcon className="w-3.5 h-3.5 animate-pulse" />
                            <span>CHALLENGE PENDING</span>
                          </span>
                        ) : (
                          <button
                            onClick={handleChallenge}
                            disabled={isChallenging}
                            className="btn btn-primary text-xs py-1.5 px-3.5 font-mono flex items-center gap-1.5"
                          >
                            <SwordsIcon className="w-3.5 h-3.5" />
                            <span>{isChallenging ? "SENDING..." : "CHALLENGE"}</span>
                          </button>
                        )}
                      </div>
                    ) : isPending || requestSent ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FCD34D] bg-[#78350F] border border-[#D97706] px-3.5 py-1.5 rounded">
                        <UserCheckIcon className="w-4 h-4" />
                        <span>REQUEST PENDING</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleSendFriendRequest}
                        disabled={isActionLoading}
                        className="btn btn-primary text-xs py-2 px-4 font-mono flex items-center gap-2"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                        <span>{isActionLoading ? "SENDING..." : "ADD FRIEND"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Competitive Rating Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="surface-card p-5">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Division Standing
                  </span>
                  <TrophyIcon className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <div className="font-mono font-bold text-2xl text-[#FCD34D]">
                  {rating} ELO
                </div>
                <div className="text-[11px] text-[#64748B] font-mono mt-1">
                  Tier: {tier.name}
                </div>
              </div>

              <div className="surface-card p-5">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Arena Combatant
                  </span>
                  <ShieldIcon className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <div className="font-mono font-bold text-2xl text-[#93C5FD]">
                  Active
                </div>
                <div className="text-[11px] text-[#64748B] font-mono mt-1">
                  Ranked Match Pool Participant
                </div>
              </div>

              <div className="surface-card p-5">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Network
                  </span>
                  <UsersIcon className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="font-mono font-bold text-2xl text-[#6EE7B7]">
                  {isFriend ? "Connected" : "Unconnected"}
                </div>
                <div className="text-[11px] text-[#64748B] font-mono mt-1">
                  Friendship Status
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
