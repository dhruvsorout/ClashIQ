"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Navbar } from "@/components/layout/Navbar";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import {
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from "@/lib/api";
import type { FriendItem, FriendRecord, PublicUser } from "@/lib/types";
import {
  CheckIcon,
  CrossIcon,
  SearchIcon,
  SwordsIcon,
  TrashIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/ui/Icons";

type TabType = "friends" | "requests" | "search";

export default function FriendsPage() {
  const { token, isLoading: authLoading, user: currentUser } = useAuth();
  const {
    challengeFriend,
    outgoingChallenges,
    incomingChallenges,
    acceptChallenge,
    lastError,
    clearError,
  } = useWebSocket();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requests, setRequests] = useState<FriendRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [challengingId, setChallengingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sync WebSocket errors to user feedback
  useEffect(() => {
    if (lastError) {
      const err = lastError;
      const timer = setTimeout(() => {
        setFeedback({ type: "error", message: err.message });
        clearError();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [lastError, clearError]);

  const handleChallenge = (friendId: string, friendUsername: string) => {
    if (challengingId === friendId) return;
    setChallengingId(friendId);
    challengeFriend(friendId);
    showNotification("success", `Challenge sent to ${friendUsername}.`);
    setTimeout(() => {
      setChallengingId(null);
    }, 3000);
  };

  // Guard
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth");
    }
  }, [authLoading, token, router]);

  const refreshFriendsData = useCallback(async () => {
    if (!token) return;
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        getFriends(token).catch(() => ({ friends: [] })),
        getFriendRequests(token).catch(() => ({ requests: [] })),
      ]);
      setFriends(friendsRes.friends ?? []);
      setRequests(requestsRes.requests ?? []);
    } catch {
      setFeedback({ type: "error", message: "Failed to reload community data." });
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    Promise.all([
      getFriends(token).catch(() => ({ friends: [] })),
      getFriendRequests(token).catch(() => ({ requests: [] })),
    ])
      .then(([friendsRes, requestsRes]) => {
        if (!isMounted) return;
        setFriends(friendsRes.friends ?? []);
        setRequests(requestsRes.requests ?? []);
      })
      .catch(() => {
        if (isMounted) setFeedback({ type: "error", message: "Failed to load community data." });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Debounced search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!token || !trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchUsers(token, trimmed);
        setSearchResults(res.users ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleAccept = async (senderId: string) => {
    if (!token || actionLoadingId) return;
    setActionLoadingId(senderId);
    try {
      await acceptFriendRequest(token, senderId);
      showNotification("success", "Friend request accepted.");
      await refreshFriendsData();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Failed to accept request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (senderId: string) => {
    if (!token || actionLoadingId) return;
    setActionLoadingId(senderId);
    try {
      await rejectFriendRequest(token, senderId);
      showNotification("success", "Friend request declined.");
      await refreshFriendsData();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Failed to decline request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemove = async (friendUserId: string, username: string) => {
    if (!token || actionLoadingId) return;
    if (!confirm(`Are you sure you want to remove ${username} from your friends?`)) return;

    setActionLoadingId(friendUserId);
    try {
      await removeFriend(token, friendUserId);
      showNotification("success", `Removed ${username} from friends.`);
      setFriends((prev) => prev.filter((f) => f.friend.id !== friendUserId));
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Failed to remove friend.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    if (!token || actionLoadingId) return;
    setActionLoadingId(targetUserId);
    try {
      await sendFriendRequest(token, targetUserId);
      showNotification("success", "Friend request transmitted.");
      setSentRequestIds((prev) => new Set(prev).add(targetUserId));
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Failed to send friend request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const isFriend = (userId: string) => friends.some((f) => f.friend.id === userId);
  const hasIncomingRequest = (userId: string) => requests.some((r) => r.sender.id === userId);

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Page Title & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UsersIcon className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider">
                COMPETITIVE NETWORK
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl text-[#F8FAFC]">
              Friends & Opponents
            </h1>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 bg-[#141A25] border border-[#222B3B] rounded text-[#94A3B8]">
              <strong className="text-[#F8FAFC]">{friends.length}</strong> FRIENDS
            </span>
            {incomingChallenges.length > 0 && (
              <span className="px-3 py-1.5 bg-[#F59E0B]/20 border border-[#F59E0B] rounded text-[#FCD34D] font-bold">
                {incomingChallenges.length} CHALLENGES
              </span>
            )}
            {requests.length > 0 && (
              <span className="px-3 py-1.5 bg-[#7F1D1D]/30 border border-[#DC2626] rounded text-[#FCA5A5] font-bold">
                {requests.length} INCOMING
              </span>
            )}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-3.5 mb-6 rounded text-xs font-mono flex items-center justify-between border ${
              feedback.type === "success"
                ? "bg-[#064E3B]/40 border-[#059669] text-[#6EE7B7]"
                : "bg-[#7F1D1D]/40 border-[#DC2626] text-[#FCA5A5]"
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-current hover:opacity-75"
              aria-label="Dismiss feedback"
            >
              <CrossIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-[#222B3B] mb-6 font-mono text-xs font-semibold">
          <button
            onClick={() => setActiveTab("friends")}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "friends"
                ? "border-[#F59E0B] text-[#F8FAFC] bg-[#141A25]"
                : "border-transparent text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>Friends ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "requests"
                ? "border-[#F59E0B] text-[#F8FAFC] bg-[#141A25]"
                : "border-transparent text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <UserCheckIcon className="w-4 h-4" />
            <span>Incoming Requests</span>
            {requests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-[#EF4444] text-white text-[10px] rounded-full font-bold">
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("search")}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "search"
                ? "border-[#F59E0B] text-[#F8FAFC] bg-[#141A25]"
                : "border-transparent text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            <SearchIcon className="w-4 h-4" />
            <span>Search & Add</span>
          </button>
        </div>

        {/* ─── TAB 1: ALL FRIENDS ────────────────────────────────────────── */}
        {activeTab === "friends" && (
          <div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : friends.length === 0 ? (
              <EmptyState
                icon={<UsersIcon className="w-6 h-6 text-[#94A3B8]" />}
                title="No Friends Added Yet"
                description="Your competitive circle is currently empty. Use the search tab to find competitors and issue friend requests."
                action={
                  <button
                    onClick={() => setActiveTab("search")}
                    className="btn btn-primary text-xs font-mono"
                  >
                    Search Competitors
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((item) => {
                  const isChallenging = challengingId === item.friend.id;
                  const hasPendingOutgoing = outgoingChallenges.some(
                    (c) => c.challenged?.id === item.friend.id
                  );
                  const hasPendingIncoming = incomingChallenges.find(
                    (c) => c.challenger.id === item.friend.id
                  );

                  return (
                    <div
                      key={item.friendshipId}
                      className="surface-card p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-[#1B2332] border border-[#2A364C] flex items-center justify-center rounded text-[#F8FAFC] font-mono font-bold shrink-0">
                          {item.friend.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/profile/${item.friend.id}`}
                            className="font-bold text-sm text-[#F8FAFC] hover:text-[#F59E0B] transition-colors truncate block"
                          >
                            {item.friend.username}
                          </Link>
                          <span className="text-xs text-[#64748B] font-mono truncate block">
                            {item.friend.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasPendingIncoming ? (
                          <button
                            onClick={() => acceptChallenge(hasPendingIncoming.id)}
                            className="btn btn-primary text-xs px-2.5 py-1.5 font-mono flex items-center gap-1.5"
                            title="Accept challenge match"
                          >
                            <SwordsIcon className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        ) : hasPendingOutgoing ? (
                          <span className="text-[11px] font-mono text-[#F59E0B] bg-[#78350F]/40 border border-[#D97706] px-2.5 py-1 rounded flex items-center gap-1.5">
                            <SwordsIcon className="w-3 h-3 animate-pulse" />
                            <span>Pending...</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleChallenge(item.friend.id, item.friend.username)}
                            disabled={isChallenging}
                            className="btn btn-primary text-xs px-2.5 py-1.5 font-mono flex items-center gap-1.5"
                            title="Challenge to a 1v1 match"
                          >
                            <SwordsIcon className="w-3.5 h-3.5" />
                            <span>{isChallenging ? "Sending..." : "Challenge"}</span>
                          </button>
                        )}

                        <Link
                          href={`/profile/${item.friend.id}`}
                          className="btn btn-outline text-xs px-2.5 py-1.5 font-mono"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => handleRemove(item.friend.id, item.friend.username)}
                          disabled={actionLoadingId === item.friend.id}
                          className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#1B2332] rounded transition-colors"
                          title="Remove friend"
                          aria-label="Remove friend"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: INCOMING REQUESTS ─────────────────────────────────── */}
        {activeTab === "requests" && (
          <div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={<UserCheckIcon className="w-6 h-6 text-[#94A3B8]" />}
                title="No Pending Friend Requests"
                description="You do not have any incoming connection requests from other players at this time."
              />
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="surface-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[#F59E0B]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1B2332] border border-[#2A364C] flex items-center justify-center rounded text-[#FCD34D] font-mono font-bold shrink-0">
                        {req.sender.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${req.sender.id}`}
                            className="font-bold text-sm text-[#F8FAFC] hover:text-[#F59E0B] transition-colors"
                          >
                            {req.sender.username}
                          </Link>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#1B2332] text-[#94A3B8] rounded border border-[#2A364C]">
                            INCOMING
                          </span>
                        </div>
                        <span className="text-xs text-[#64748B] font-mono">
                          {req.sender.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(req.sender.id)}
                        disabled={actionLoadingId === req.sender.id}
                        className="btn btn-primary text-xs py-1.5 px-3 font-mono flex items-center gap-1.5"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleReject(req.sender.id)}
                        disabled={actionLoadingId === req.sender.id}
                        className="btn btn-secondary text-xs py-1.5 px-3 font-mono flex items-center gap-1.5"
                      >
                        <CrossIcon className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: SEARCH & ADD FRIENDS ───────────────────────────────── */}
        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="surface-card p-5">
              <label className="block text-xs font-mono font-semibold uppercase text-[#94A3B8] mb-2 tracking-wider">
                Find Competitors by Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) {
                      setSearchResults([]);
                    }
                  }}
                  placeholder="Type username or email..."
                  className="input-solid h-11 pl-10 text-sm font-sans"
                  autoFocus
                />
                <SearchIcon className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] font-mono text-[#64748B] mt-2">
                Live search scans active registered player databases.
              </p>
            </div>

            {/* Search Results Display */}
            {isSearching ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : searchQuery.trim() && searchResults.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="w-6 h-6 text-[#94A3B8]" />}
                title="No Competitors Found"
                description={`No active accounts matched the query "${searchQuery}". Check spelling or try a different username.`}
              />
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider px-1">
                  SEARCH RESULTS ({searchResults.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((user) => {
                    const alreadyFriend = isFriend(user.id);
                    const incomingReq = hasIncomingRequest(user.id);
                    const requestSent = sentRequestIds.has(user.id);
                    const isSelf = user.id === currentUser?.id;

                    return (
                      <div
                        key={user.id}
                        className="surface-card p-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-[#1B2332] border border-[#2A364C] flex items-center justify-center rounded text-[#F8FAFC] font-mono font-bold shrink-0">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/profile/${user.id}`}
                                className="font-bold text-sm text-[#F8FAFC] hover:text-[#F59E0B] transition-colors truncate block"
                              >
                                {user.username}
                              </Link>
                              <RatingBadge rating={user.rating} size="sm" />
                            </div>
                            <span className="text-xs text-[#64748B] font-mono truncate block">
                              {user.email}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelf ? (
                            <span className="text-[10px] font-mono text-[#64748B] px-2 py-1 bg-[#1B2332] rounded">
                              YOU
                            </span>
                          ) : alreadyFriend ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6EE7B7] bg-[#064E3B] border border-[#059669] px-2.5 py-1 rounded">
                              <CheckIcon className="w-3 h-3" />
                              <span>FRIEND</span>
                            </span>
                          ) : incomingReq ? (
                            <button
                              onClick={() => handleAccept(user.id)}
                              className="btn btn-primary text-xs py-1 px-3 font-mono"
                            >
                              Accept Request
                            </button>
                          ) : requestSent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FCD34D] bg-[#78350F] border border-[#D97706] px-2.5 py-1 rounded">
                              <span>REQUEST SENT</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendRequest(user.id)}
                              disabled={actionLoadingId === user.id}
                              className="btn btn-secondary text-xs py-1.5 px-3 font-mono flex items-center gap-1.5"
                            >
                              <UserPlusIcon className="w-3.5 h-3.5" />
                              <span>Add Friend</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
