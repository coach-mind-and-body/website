export type PairGroup = { memberIds: number[] };

function shuffle<T>(items: T[], rng: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * Random pairs. If the count is odd, one group is a trio so nobody sits out.
 * 0–1 people → no groups. 3 people → one trio.
 */
export function pairRandom(
  memberIds: number[],
  rng: () => number = Math.random
): PairGroup[] {
  const unique = [...new Set(memberIds)];
  if (unique.length < 2) return [];

  const shuffled = shuffle(unique, rng);

  if (shuffled.length === 3) {
    return [{ memberIds: shuffled }];
  }

  const groups: PairGroup[] = [];
  if (shuffled.length % 2 === 1) {
    const rest = shuffled.slice(0, -3);
    const trio = shuffled.slice(-3);
    for (let i = 0; i < rest.length; i += 2) {
      groups.push({ memberIds: [rest[i], rest[i + 1]] });
    }
    groups.push({ memberIds: trio });
    return groups;
  }

  for (let i = 0; i < shuffled.length; i += 2) {
    groups.push({ memberIds: [shuffled[i], shuffled[i + 1]] });
  }
  return groups;
}

export function groupSizes(groups: PairGroup[]): number[] {
  return groups.map((g) => g.memberIds.length);
}

/**
 * Keep pairs that are still fully in. Newly in people get paired with
 * other unmatched people. A leftover person waits for the next check-in.
 */
export function reconcileGroups(
  existing: PairGroup[],
  inIds: number[],
  rng: () => number = Math.random
): PairGroup[] {
  const inSet = new Set(inIds);
  const kept: PairGroup[] = [];
  const claimed = new Set<number>();

  for (const group of existing) {
    const still = group.memberIds.filter((id) => inSet.has(id));
    if (still.length >= 2) {
      kept.push({ memberIds: still });
      for (const id of still) claimed.add(id);
    }
  }

  const unmatched = inIds.filter((id) => inSet.has(id) && !claimed.has(id));
  return [...kept, ...pairRandom(unmatched, rng)];
}
