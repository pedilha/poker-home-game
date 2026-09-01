import { describe, expect, it } from "vitest";

// Sanity check do pipeline de testes — remover quando a Fase 3
// (lógica de conciliação) trouxer os primeiros testes reais.
describe("setup", () => {
  it("roda testes unitários", () => {
    expect(1 + 1).toBe(2);
  });
});
