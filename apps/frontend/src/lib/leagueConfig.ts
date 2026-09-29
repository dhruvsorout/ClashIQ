/**
 * ClashIQ League & Rating Configuration
 *
 * Centralized configuration for competitive tiers, thresholds, and rating progress logic.
 * NOTE: The exact league thresholds configured below are placeholder values designed
 * for the 1000 baseline rating system and can be customized here without modifying
 * component-level logic.
 */

export interface League {
  id: string;
  name: string;
  minRating: number;
  maxRating: number | null; // null represents unbounded top tier (e.g. 1800+)
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  accentColor: string;
  description: string;
  rankIndex: number;
}

export const BASE_RATING = 1000;

/**
 * Placeholder League Tiers
 * Baseline 1000 rating places starting players in the Gold tier upon ranking.
 * Players below 1000 compete in Silver / Bronze, and climb up toward Grandmaster.
 */
export const LEAGUES: League[] = [
  {
    id: "bronze",
    name: "Bronze",
    minRating: 0,
    maxRating: 799,
    badgeColor: "text-[#D97706]",
    badgeBg: "bg-[#451A03]/30",
    badgeBorder: "border-[#B45309]",
    accentColor: "#D97706",
    description: "Developing speed-calculation instincts and basic arithmetic fundamentals.",
    rankIndex: 0,
  },
  {
    id: "silver",
    name: "Silver",
    minRating: 800,
    maxRating: 999,
    badgeColor: "text-[#CBD5E1]",
    badgeBg: "bg-[#334155]/30",
    badgeBorder: "border-[#64748B]",
    accentColor: "#94A3B8",
    description: "Solid arithmetic mechanics and steady pace under match pressure.",
    rankIndex: 1,
  },
  {
    id: "gold",
    name: "Gold",
    minRating: 1000,
    maxRating: 1199,
    badgeColor: "text-[#FCD34D]",
    badgeBg: "bg-[#78350F]/30",
    badgeBorder: "border-[#F59E0B]",
    accentColor: "#F59E0B",
    description: "The baseline competitive division. High accuracy with sharp mental math execution.",
    rankIndex: 2,
  },
  {
    id: "platinum",
    name: "Platinum",
    minRating: 1200,
    maxRating: 1399,
    badgeColor: "text-[#67E8F9]",
    badgeBg: "bg-[#164E63]/30",
    badgeBorder: "border-[#06B6D4]",
    accentColor: "#06B6D4",
    description: "Advanced contenders exhibiting rapid division and multi-step speed calculations.",
    rankIndex: 3,
  },
  {
    id: "diamond",
    name: "Diamond",
    minRating: 1400,
    maxRating: 1599,
    badgeColor: "text-[#93C5FD]",
    badgeBg: "bg-[#1E3A8A]/30",
    badgeBorder: "border-[#3B82F6]",
    accentColor: "#3B82F6",
    description: "Elite performers with sub-second response times and razor-thin error margins.",
    rankIndex: 4,
  },
  {
    id: "master",
    name: "Master",
    minRating: 1600,
    maxRating: 1799,
    badgeColor: "text-[#C084FC]",
    badgeBg: "bg-[#581C87]/30",
    badgeBorder: "border-[#A855F7]",
    accentColor: "#A855F7",
    description: "Mastery of speed mathematics, maintaining composure in high-stakes duels.",
    rankIndex: 5,
  },
  {
    id: "grandmaster",
    name: "Grandmaster",
    minRating: 1800,
    maxRating: null,
    badgeColor: "text-[#F43F5E]",
    badgeBg: "bg-[#881337]/30",
    badgeBorder: "border-[#E11D48]",
    accentColor: "#E11D48",
    description: "The apex competitive tier. Flawless execution at the upper limits of human calculation.",
    rankIndex: 6,
  },
];

export const UNRANKED_TIER = {
  id: "unranked",
  name: "UNRANKED",
  description: "Play your first game to calibrate your placement on the competitive ladder.",
  badgeColor: "text-[#94A3B8]",
  badgeBg: "bg-[#1E293B]",
  badgeBorder: "border-[#334155]",
  accentColor: "#64748B",
  minRating: 0,
  maxRating: null,
  rankIndex: -1,
};

/**
 * Determines the league for a given rating.
 * Safely handles null, undefined, NaN, negatives, and unbounded upper boundaries.
 */
export function getLeagueFromRating(rating: number | null | undefined): League {
  const safeRating = typeof rating === "number" && !isNaN(rating) ? Math.max(0, Math.round(rating)) : BASE_RATING;

  // Search from highest league downwards
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    const league = LEAGUES[i];
    if (safeRating >= league.minRating) {
      return league;
    }
  }

  // Fallback to lowest tier
  return LEAGUES[0];
}

/**
 * Gets user league status considering whether they have played at least one match.
 * If totalGames is 0, user is UNRANKED regardless of their 1000 baseline rating.
 */
export function getUserLeagueStatus({
  rating,
  totalGames,
}: {
  rating?: number | null;
  totalGames?: number | null;
}): {
  isUnranked: boolean;
  league: League | typeof UNRANKED_TIER;
  rating: number;
} {
  const safeRating = typeof rating === "number" && !isNaN(rating) ? Math.max(0, Math.round(rating)) : BASE_RATING;
  const gamesPlayed = typeof totalGames === "number" && !isNaN(totalGames) ? totalGames : 0;

  if (gamesPlayed === 0) {
    return {
      isUnranked: true,
      league: UNRANKED_TIER,
      rating: safeRating,
    };
  }

  return {
    isUnranked: false,
    league: getLeagueFromRating(safeRating),
    rating: safeRating,
  };
}

/**
 * Returns the next higher league in the ladder, or null if currently in the apex league.
 */
export function getNextLeague(currentLeague: League): League | null {
  const currentIndex = LEAGUES.findIndex((l) => l.id === currentLeague.id);
  if (currentIndex === -1 || currentIndex >= LEAGUES.length - 1) {
    return null;
  }
  return LEAGUES[currentIndex + 1];
}

export interface LeagueProgressInfo {
  isUnranked: boolean;
  currentLeague: League | typeof UNRANKED_TIER;
  nextLeague: League | null;
  currentRating: number;
  currentInTier: number;
  tierSpan: number | null;
  ratingNeeded: number;
  progressPercent: number;
  isMaxLeague: boolean;
}

/**
 * Calculates current progress within the tier, rating needed for next promotion,
 * and progress percentage.
 */
export function getLeagueProgress(
  rating: number | null | undefined,
  isUnranked: boolean
): LeagueProgressInfo {
  const safeRating = typeof rating === "number" && !isNaN(rating) ? Math.max(0, Math.round(rating)) : BASE_RATING;

  if (isUnranked) {
    return {
      isUnranked: true,
      currentLeague: UNRANKED_TIER,
      nextLeague: LEAGUES[0],
      currentRating: safeRating,
      currentInTier: 0,
      tierSpan: null,
      ratingNeeded: 0,
      progressPercent: 0,
      isMaxLeague: false,
    };
  }

  const currentLeague = getLeagueFromRating(safeRating);
  const nextLeague = getNextLeague(currentLeague);

  // Highest league case (e.g. Grandmaster unbounded)
  if (!nextLeague || currentLeague.maxRating === null) {
    const currentInTier = safeRating - currentLeague.minRating;
    return {
      isUnranked: false,
      currentLeague,
      nextLeague: null,
      currentRating: safeRating,
      currentInTier,
      tierSpan: null,
      ratingNeeded: 0,
      progressPercent: 100,
      isMaxLeague: true,
    };
  }

  const tierSpan = currentLeague.maxRating - currentLeague.minRating + 1;
  const currentInTier = Math.max(0, safeRating - currentLeague.minRating);
  const ratingNeeded = Math.max(0, nextLeague.minRating - safeRating);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentInTier / tierSpan) * 100)));

  return {
    isUnranked: false,
    currentLeague,
    nextLeague,
    currentRating: safeRating,
    currentInTier,
    tierSpan,
    ratingNeeded,
    progressPercent,
    isMaxLeague: false,
  };
}
