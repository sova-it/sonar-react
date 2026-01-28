import { Score, RankingEntry, Athlete } from '@/types/results';
import { parseTimeToMilliseconds } from '@/utils/scoreValidation';

export const calculateTrackRankings = (
  scores: Score[],
  athleteMap: Map<string, Athlete>
): RankingEntry[] => {
  // Parse times to milliseconds for accurate sorting
  const parsed = scores.map((s) => ({
    ...s,
    timeMs: parseTimeToMilliseconds(s.score),
    athlete_name: getAthleteName(s.athlete_id, athleteMap),
  }));

  // Sort ascending (lower time = better rank)
  parsed.sort((a, b) => a.timeMs - b.timeMs);

  // Assign ranks with tie handling
  let rank = 1;
  const rankings: RankingEntry[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const isTied = i > 0 && parsed[i].timeMs === parsed[i - 1].timeMs;

    // Only increment rank if not tied and not first place
    if (!isTied && i > 0) {
      rank = i + 1;
    }

    rankings.push({
      score_id: parsed[i]._id,
      athlete_id: parsed[i].athlete_id,
      athlete_name: parsed[i].athlete_name,
      score: parsed[i].score,
      rank,
      isTie: isTied,
      timeMs: parsed[i].timeMs,
    });
  }

  return rankings;
};

const getAthleteName = (
  athleteId: string,
  athleteMap: Map<string, Athlete>
): string => {
  const athlete = athleteMap.get(athleteId);
  if (athlete) {
    return `${athlete.first_name} ${athlete.last_name}`;
  }
  return 'Unknown Athlete';
};