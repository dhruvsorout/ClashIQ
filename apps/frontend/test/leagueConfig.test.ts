import assert from "node:assert";
import {
  LEAGUES,
  UNRANKED_TIER,
  BASE_RATING,
  getLeagueFromRating,
  getUserLeagueStatus,
  getNextLeague,
  getLeagueProgress,
} from "../src/lib/leagueConfig";

console.log("=========================================");
console.log("RUNNING CLASHIQL LEAGUE & RATING TESTS");
console.log("=========================================\n");

let passed = 0;
let total = 0;

function it(name: string, fn: () => void) {
  total++;
  try {
    fn();
    console.log(`[PASS] Test ${total}: ${name}`);
    passed++;
  } catch (err: unknown) {
    console.error(`[FAIL] Test ${total}: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// 1. Unranked tests
it("New user with 0 games is UNRANKED with 1000 baseline rating", () => {
  const status = getUserLeagueStatus({ rating: 1000, totalGames: 0 });
  assert.strictEqual(status.isUnranked, true);
  assert.strictEqual(status.league.id, "unranked");
  assert.strictEqual(status.league.name, "UNRANKED");
  assert.strictEqual(status.rating, 1000);
});

it("New user with undefined totalGames defaults to UNRANKED", () => {
  const status = getUserLeagueStatus({ rating: 1000, totalGames: undefined });
  assert.strictEqual(status.isUnranked, true);
  assert.strictEqual(status.league.id, "unranked");
});

it("New user with null totalGames defaults to UNRANKED", () => {
  const status = getUserLeagueStatus({ rating: null, totalGames: null });
  assert.strictEqual(status.isUnranked, true);
  assert.strictEqual(status.rating, 1000);
});

it("User with at least 1 game completed is RANKED", () => {
  const status = getUserLeagueStatus({ rating: 1058, totalGames: 1 });
  assert.strictEqual(status.isUnranked, false);
  assert.strictEqual(status.league.id, "gold");
  assert.strictEqual(status.league.name, "Gold");
});

// 2. League boundary and threshold tests
it("Rating at league minimum returns correct league (1000 -> Gold)", () => {
  const league = getLeagueFromRating(1000);
  assert.strictEqual(league.id, "gold");
  assert.strictEqual(league.minRating, 1000);
});

it("Rating at league maximum returns correct league (1199 -> Gold)", () => {
  const league = getLeagueFromRating(1199);
  assert.strictEqual(league.id, "gold");
  assert.strictEqual(league.maxRating, 1199);
});

it("Rating exactly at next league boundary promotes to next league (1200 -> Platinum)", () => {
  const league = getLeagueFromRating(1200);
  assert.strictEqual(league.id, "platinum");
  assert.strictEqual(league.minRating, 1200);
});

it("Rating in middle of league returns correct tier (1058 -> Gold)", () => {
  const league = getLeagueFromRating(1058);
  assert.strictEqual(league.id, "gold");
});

it("Bronze tier covers low ratings down to 0 (0 -> Bronze, 450 -> Bronze)", () => {
  const lowZero = getLeagueFromRating(0);
  const lowMid = getLeagueFromRating(450);
  assert.strictEqual(lowZero.id, "bronze");
  assert.strictEqual(lowMid.id, "bronze");
});

it("Silver tier covers 800 - 999 (800 -> Silver, 950 -> Silver, 999 -> Silver)", () => {
  assert.strictEqual(getLeagueFromRating(800).id, "silver");
  assert.strictEqual(getLeagueFromRating(950).id, "silver");
  assert.strictEqual(getLeagueFromRating(999).id, "silver");
});

it("Apex league (Grandmaster) covers unbounded upper ratings (1800, 2400, 3000 -> Grandmaster)", () => {
  assert.strictEqual(getLeagueFromRating(1800).id, "grandmaster");
  assert.strictEqual(getLeagueFromRating(2400).id, "grandmaster");
  assert.strictEqual(getLeagueFromRating(3500).id, "grandmaster");
});

// 3. Invalid & Edge case input handling
it("Undefined rating safely defaults to baseline rating (1000 -> Gold)", () => {
  const league = getLeagueFromRating(undefined);
  assert.strictEqual(league.id, "gold");
});

it("Null rating safely defaults to baseline rating (1000 -> Gold)", () => {
  const league = getLeagueFromRating(null);
  assert.strictEqual(league.id, "gold");
});

it("NaN rating safely defaults to baseline rating (1000 -> Gold)", () => {
  const league = getLeagueFromRating(NaN);
  assert.strictEqual(league.id, "gold");
});

it("Negative rating clamps safely to lowest tier (Bronze)", () => {
  const league = getLeagueFromRating(-250);
  assert.strictEqual(league.id, "bronze");
});

// 4. Progress calculations
it("Calculates progress correctly for 1058 in Gold (tierSpan: 200, currentInTier: 58, 142 to Platinum)", () => {
  const prog = getLeagueProgress(1058, false);
  assert.strictEqual(prog.isUnranked, false);
  assert.strictEqual(prog.currentLeague.name, "Gold");
  assert.strictEqual(prog.nextLeague?.name, "Platinum");
  assert.strictEqual(prog.currentInTier, 58);
  assert.strictEqual(prog.tierSpan, 200);
  assert.strictEqual(prog.ratingNeeded, 142);
  assert.strictEqual(prog.progressPercent, 29); // Math.round(58 / 200 * 100) = 29
  assert.strictEqual(prog.isMaxLeague, false);
});

it("Calculates progress correctly at start of Platinum (1200: 0 in tier, 200 to Diamond, 0% progress)", () => {
  const prog = getLeagueProgress(1200, false);
  assert.strictEqual(prog.currentLeague.name, "Platinum");
  assert.strictEqual(prog.nextLeague?.name, "Diamond");
  assert.strictEqual(prog.currentInTier, 0);
  assert.strictEqual(prog.ratingNeeded, 200);
  assert.strictEqual(prog.progressPercent, 0);
});

it("Calculates progress correctly for Grandmaster (Apex tier, 100% progress, nextLeague: null)", () => {
  const prog = getLeagueProgress(1950, false);
  assert.strictEqual(prog.currentLeague.name, "Grandmaster");
  assert.strictEqual(prog.nextLeague, null);
  assert.strictEqual(prog.isMaxLeague, true);
  assert.strictEqual(prog.progressPercent, 100);
  assert.strictEqual(prog.ratingNeeded, 0);
  assert.strictEqual(prog.currentInTier, 150);
});

it("Calculates progress correctly for UNRANKED (0% progress, isUnranked: true)", () => {
  const prog = getLeagueProgress(1000, true);
  assert.strictEqual(prog.isUnranked, true);
  assert.strictEqual(prog.currentLeague.id, "unranked");
  assert.strictEqual(prog.progressPercent, 0);
  assert.strictEqual(prog.isMaxLeague, false);
});

console.log("\n=========================================");
console.log(`TOTAL TESTS: ${total}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${total - passed}`);
console.log("=========================================");
