import { db } from "@ClashIQ/db";
import { logger } from "../utils/logger.js";

export interface RatingResult {
  winnerId: string;
  loserId: string;
  winnerOldRating: number;
  winnerNewRating: number;
  winnerDelta: number;
  loserOldRating: number;
  loserNewRating: number;
  loserDelta: number;
}

export class RatingService {
  private static readonly DEFAULT_RATING = 1000;
  private static readonly K_FACTOR = 32;

  /**
   * Calculates the expected score of player A against player B using standard Elo.
   */
  public static calculateExpectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  /**
   * Calculates the rating change for a 1v1 match outcome.
   * Ensures winner gains at least 8 points and loser never drops below 0.
   */
  public static calculateMatchDeltas(winnerRating: number, loserRating: number): {
    winnerDelta: number;
    loserDelta: number;
  } {
    const expectedWinner = this.calculateExpectedScore(winnerRating, loserRating);
    const winnerDelta = Math.max(8, Math.round(this.K_FACTOR * (1 - expectedWinner)));
    // In standard zero-sum Elo, loser delta matches winner delta
    const loserDelta = winnerDelta;

    return { winnerDelta, loserDelta };
  }

  /**
   * Atomically updates the ratings of two players in the database.
   * Can be executed within an existing Prisma transaction or standalone.
   */
  public static async updateMatchRatings(
    winnerId: string,
    loserId: string,
    tx?: Parameters<Parameters<typeof db.$transaction>[0]>[0]
  ): Promise<RatingResult> {
    const prisma = tx ?? db;

    // Fetch existing ratings (or default to 1000)
    const [winnerRatingRecord, loserRatingRecord] = await Promise.all([
      prisma.userRating.findUnique({ where: { userId: winnerId } }),
      prisma.userRating.findUnique({ where: { userId: loserId } }),
    ]);

    const winnerOldRating = winnerRatingRecord?.rating ?? this.DEFAULT_RATING;
    const loserOldRating = loserRatingRecord?.rating ?? this.DEFAULT_RATING;

    const { winnerDelta, loserDelta } = this.calculateMatchDeltas(winnerOldRating, loserOldRating);

    const winnerNewRating = winnerOldRating + winnerDelta;
    const loserNewRating = Math.max(0, loserOldRating - loserDelta);

    // Upsert both user ratings
    await Promise.all([
      prisma.userRating.upsert({
        where: { userId: winnerId },
        update: { rating: winnerNewRating },
        create: { userId: winnerId, rating: winnerNewRating },
      }),
      prisma.userRating.upsert({
        where: { userId: loserId },
        update: { rating: loserNewRating },
        create: { userId: loserId, rating: loserNewRating },
      }),
    ]);

    logger.info("Updated match ratings", {
      winnerId,
      loserId,
      winnerOldRating,
      winnerNewRating,
      winnerDelta,
      loserOldRating,
      loserNewRating,
      loserDelta,
    });

    return {
      winnerId,
      loserId,
      winnerOldRating,
      winnerNewRating,
      winnerDelta,
      loserOldRating,
      loserNewRating,
      loserDelta,
    };
  }
}
