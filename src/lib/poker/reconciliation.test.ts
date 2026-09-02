import { describe, expect, it } from "vitest";
import {
  applyProportionalCorrection,
  declaredValueForColor,
  netResult,
  proportionalCorrectionFactor,
  reconcileMatch,
  totalDeclaredValue,
} from "./reconciliation";

describe("declaredValueForColor", () => {
  it("multiplica quantidade de fichas x unidades da cor x valor da unidade", () => {
    // 8 fichas verdes, cada uma vale 250 unidades, unidade = R$0,10 -> R$200
    expect(declaredValueForColor(8, 250, 0.1)).toBe(200);
  });

  it("zero fichas declaradas vale zero", () => {
    expect(declaredValueForColor(0, 250, 0.1)).toBe(0);
  });
});

describe("totalDeclaredValue", () => {
  it("soma o valor de todas as cores declaradas por um jogador", () => {
    // Pedro do seed: 8 verdes (250un) + 10 vermelhas (10un), unidade R$0,10
    const total = totalDeclaredValue(
      [
        { chipCount: 8, units: 250 },
        { chipCount: 10, units: 10 },
      ],
      0.1,
    );
    expect(total).toBe(210);
  });

  it("lista vazia soma zero", () => {
    expect(totalDeclaredValue([], 0.1)).toBe(0);
  });
});

describe("reconcileMatch", () => {
  it("não diverge quando o total declarado bate com o investido", () => {
    expect(reconcileMatch(400, 400)).toEqual({
      isDivergent: false,
      divergenceAmount: 0,
    });
  });

  it("detecta divergência quando o declarado é maior que o investido", () => {
    // caso do seed: 4 jogadores, investido 400, declarado 455
    expect(reconcileMatch(400, 455)).toEqual({
      isDivergent: true,
      divergenceAmount: 55,
    });
  });

  it("detecta divergência quando o declarado é menor que o investido", () => {
    expect(reconcileMatch(400, 380)).toEqual({
      isDivergent: true,
      divergenceAmount: -20,
    });
  });

  it("ignora diferenças de arredondamento de ponto flutuante", () => {
    // 0.1 + 0.2 tipicamente vira 0.30000000000000004 em JS
    expect(reconcileMatch(0.3, 0.1 + 0.2)).toEqual({
      isDivergent: false,
      divergenceAmount: 0,
    });
  });
});

describe("proportionalCorrectionFactor", () => {
  it("calcula o fator como total investido dividido pelo total declarado", () => {
    expect(proportionalCorrectionFactor(400, 455)).toBeCloseTo(400 / 455, 10);
  });

  it("fator 1 quando não há divergência", () => {
    expect(proportionalCorrectionFactor(400, 400)).toBe(1);
  });

  it("lança erro se o total declarado for zero (divisão por zero)", () => {
    expect(() => proportionalCorrectionFactor(400, 0)).toThrow();
  });
});

describe("applyProportionalCorrection", () => {
  it("aplica o fator preservando a proporção entre quem ganhou e quem perdeu", () => {
    const factor = proportionalCorrectionFactor(400, 455);
    // Pedro declarou 210 -> corrigido proporcionalmente e arredondado a centavos
    expect(applyProportionalCorrection(210, factor)).toBeCloseTo(184.62, 2);
  });

  it("fator 1 não altera o valor declarado", () => {
    expect(applyProportionalCorrection(210, 1)).toBe(210);
  });
});

describe("netResult", () => {
  it("saldo positivo quando o valor final supera o investido", () => {
    expect(netResult(210, 150)).toBe(60);
  });

  it("saldo negativo quando o valor final é menor que o investido", () => {
    expect(netResult(40, 50)).toBe(-10);
  });

  it("saldo zero quando o jogador empata com o que investiu", () => {
    expect(netResult(100, 100)).toBe(0);
  });
});
