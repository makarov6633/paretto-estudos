import { db } from "@/lib/db";
import {
  userGamification,
  userBadge,
  badgeDefinition,
} from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

type BadgeRequirement = {
  type: string;
  value: number;
};

export async function ensureUserGamification(userId: string) {
  const existing = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userGamification).values({
      userId,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      level: 1,
      itemsRead: 0,
      updatedAt: new Date(),
    });
  }
}

export async function addPoints(
  userId: string,
  points: number,
  reason: string,
  referenceId?: string
) {
  await ensureUserGamification(userId);

  await db
    .update(userGamification)
    .set({
      totalPoints: sql`${userGamification.totalPoints} + ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(userGamification.userId, userId));

  await checkAndAwardBadges(userId);

  return points;
}

export async function updateStreak(userId: string) {
  await ensureUserGamification(userId);

  const user = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  if (user.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastStudy = user[0].lastStudyDate
    ? new Date(user[0].lastStudyDate)
    : null;

  if (lastStudy) {
    lastStudy.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      return;
    } else if (daysDiff === 1) {
      const newStreak = user[0].currentStreak + 1;
      const newLongest = Math.max(newStreak, user[0].longestStreak);

      await db
        .update(userGamification)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastStudyDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userGamification.userId, userId));

      await checkAndAwardBadges(userId);
    } else {
      await db
        .update(userGamification)
        .set({
          currentStreak: 1,
          lastStudyDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userGamification.userId, userId));
    }
  } else {
    await db
      .update(userGamification)
      .set({
        currentStreak: 1,
        lastStudyDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userGamification.userId, userId));
  }
}

export async function incrementStat(
  userId: string,
  stat: "itemsRead"
) {
  await ensureUserGamification(userId);

  await db
    .update(userGamification)
    .set({
      [stat]: sql`${userGamification[stat]} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(userGamification.userId, userId));

  await checkAndAwardBadges(userId);
}

async function checkAndAwardBadges(userId: string) {
  const userStats = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  if (userStats.length === 0) return;

  const stats = userStats[0];

  const allBadges = await db.select().from(badgeDefinition);

  const userBadges = await db
    .select()
    .from(userBadge)
    .where(eq(userBadge.userId, userId));

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  const newBadges: string[] = [];

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    const req = badge.requirement as unknown as BadgeRequirement;

    let qualified = false;

    switch (req.type) {
      case "points":
        qualified = stats.totalPoints >= req.value;
        break;
      case "streak":
        qualified = stats.currentStreak >= req.value;
        break;
      case "itemsRead":
        qualified = stats.itemsRead >= req.value;
        break;
    }

    if (qualified) {
      await db.insert(userBadge).values({
        userId,
        badgeId: badge.id,
        earnedAt: new Date(),
        seen: false,
      });

      if (badge.points > 0) {
        await db
          .update(userGamification)
          .set({
            totalPoints: sql`${userGamification.totalPoints} + ${badge.points}`,
            updatedAt: new Date(),
          })
          .where(eq(userGamification.userId, userId));
      }

      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

export async function getUserGamification(userId: string) {
  await ensureUserGamification(userId);

  const user = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId))
    .limit(1);

  return user[0] || null;
}

export async function getUserBadges(userId: string) {
  const badges = await db
    .select({
      badge: badgeDefinition,
      earnedAt: userBadge.earnedAt,
      seen: userBadge.seen,
    })
    .from(userBadge)
    .innerJoin(badgeDefinition, eq(userBadge.badgeId, badgeDefinition.id))
    .where(eq(userBadge.userId, userId));

  return badges;
}

export async function markBadgesSeen(userId: string, badgeIds: string[]) {
  for (const badgeId of badgeIds) {
    await db
      .update(userBadge)
      .set({ seen: true })
      .where(
        and(eq(userBadge.userId, userId), eq(userBadge.badgeId, badgeId))
      );
  }
}
