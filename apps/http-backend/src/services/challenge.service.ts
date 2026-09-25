import { db } from "@ClashIQ/db";

export interface PendingChallengeUser {
  id: string;
  username: string;
  email: string;
  rating: number;
}

export interface PendingChallengeItem {
  id: string;
  challenger: PendingChallengeUser;
  challenged?: PendingChallengeUser;
  createdAt: Date;
  expiresAt: Date;
}

export const getPendingChallenges = async (
  userId: string
): Promise<{ incoming: PendingChallengeItem[]; outgoing: PendingChallengeItem[] }> => {
  const now = new Date();

  // Expire stale challenges
  await db.gameChallenge.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  const [incomingRaw, outgoingRaw] = await Promise.all([
    db.gameChallenge.findMany({
      where: {
        challengedId: userId,
        status: "PENDING",
        expiresAt: { gt: now },
      },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            email: true,
            rating: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.gameChallenge.findMany({
      where: {
        challengerId: userId,
        status: "PENDING",
        expiresAt: { gt: now },
      },
      include: {
        challenged: {
          select: {
            id: true,
            username: true,
            email: true,
            rating: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const incoming: PendingChallengeItem[] = incomingRaw.map((c) => ({
    id: c.id,
    challenger: {
      id: c.challenger.id,
      username: c.challenger.username,
      email: c.challenger.email,
      rating: c.challenger.rating?.rating ?? 1000,
    },
    createdAt: c.createdAt,
    expiresAt: c.expiresAt,
  }));

  const outgoing: PendingChallengeItem[] = outgoingRaw.map((c) => ({
    id: c.id,
    challenger: {
      id: userId,
      username: "",
      email: "",
      rating: 1000,
    },
    challenged: {
      id: c.challenged.id,
      username: c.challenged.username,
      email: c.challenged.email,
      rating: c.challenged.rating?.rating ?? 1000,
    },
    createdAt: c.createdAt,
    expiresAt: c.expiresAt,
  }));

  return { incoming, outgoing };
};
