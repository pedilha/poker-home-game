export type PlayerScore = { playerId: string; netTotal: number };
export type RankedPlayer = PlayerScore & { position: number };

// standard competition ranking: empatados dividem a posição, e a próxima
// posição pula o número de empatados (1, 2, 2, 4)
export function rankPlayers(scores: PlayerScore[]): RankedPlayer[] {
  const sorted = [...scores].sort((a, b) => b.netTotal - a.netTotal);

  const ranked: RankedPlayer[] = [];
  let lastNetTotal: number | null = null;
  let lastPosition = 0;

  sorted.forEach((score, index) => {
    const position = score.netTotal === lastNetTotal ? lastPosition : index + 1;
    ranked.push({ ...score, position });
    lastNetTotal = score.netTotal;
    lastPosition = position;
  });

  return ranked;
}
