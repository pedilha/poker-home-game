import { describe, expect, it } from "vitest";
import { rankPlayers } from "./ranking";

describe("rankPlayers", () => {
  it("ordena por saldo líquido acumulado, do maior pro menor", () => {
    const ranked = rankPlayers([
      { playerId: "vitor", netTotal: 180 },
      { playerId: "pedro", netTotal: 200 },
      { playerId: "chris", netTotal: 190 },
    ]);
    expect(ranked.map((r) => r.playerId)).toEqual(["pedro", "chris", "vitor"]);
  });

  it("aplica standard competition ranking em caso de empate (1, 2, 2, 4)", () => {
    const ranked = rankPlayers([
      { playerId: "pedro", netTotal: 200 },
      { playerId: "tarcisio", netTotal: 190 },
      { playerId: "chris", netTotal: 190 },
      { playerId: "vitor", netTotal: 180 },
    ]);
    expect(ranked).toEqual([
      { playerId: "pedro", netTotal: 200, position: 1 },
      { playerId: "tarcisio", netTotal: 190, position: 2 },
      { playerId: "chris", netTotal: 190, position: 2 },
      { playerId: "vitor", netTotal: 180, position: 4 },
    ]);
  });

  it("todos empatados ficam todos na posição 1", () => {
    const ranked = rankPlayers([
      { playerId: "a", netTotal: 50 },
      { playerId: "b", netTotal: 50 },
      { playerId: "c", netTotal: 50 },
    ]);
    expect(ranked.map((r) => r.position)).toEqual([1, 1, 1]);
  });

  it("lida com saldos negativos normalmente", () => {
    const ranked = rankPlayers([
      { playerId: "a", netTotal: -20 },
      { playerId: "b", netTotal: 30 },
      { playerId: "c", netTotal: -20 },
    ]);
    expect(ranked).toEqual([
      { playerId: "b", netTotal: 30, position: 1 },
      { playerId: "a", netTotal: -20, position: 2 },
      { playerId: "c", netTotal: -20, position: 2 },
    ]);
  });

  it("lista vazia retorna lista vazia", () => {
    expect(rankPlayers([])).toEqual([]);
  });
});
