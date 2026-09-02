function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function declaredValueForColor(
  chipCount: number,
  units: number,
  unitValue: number,
): number {
  return round2(chipCount * units * unitValue);
}

export function totalDeclaredValue(
  declarations: { chipCount: number; units: number }[],
  unitValue: number,
): number {
  return round2(
    declarations.reduce(
      (sum, d) => sum + d.chipCount * d.units * unitValue,
      0,
    ),
  );
}

export function reconcileMatch(
  totalInvested: number,
  totalDeclared: number,
): { isDivergent: boolean; divergenceAmount: number } {
  const divergenceAmount = round2(totalDeclared - totalInvested);
  return {
    isDivergent: divergenceAmount !== 0,
    divergenceAmount,
  };
}

export function proportionalCorrectionFactor(
  totalInvested: number,
  totalDeclared: number,
): number {
  if (totalDeclared === 0) {
    throw new Error(
      "Não é possível calcular a correção proporcional com total declarado igual a zero.",
    );
  }
  return totalInvested / totalDeclared;
}

export function applyProportionalCorrection(
  declaredAmount: number,
  factor: number,
): number {
  return round2(declaredAmount * factor);
}

export function netResult(finalAmount: number, totalInvested: number): number {
  return round2(finalAmount - totalInvested);
}
