import { ChevronDown } from "lucide-react";
import { Card, PageContainer, PageHeader } from "@/components/ui";

const HANDS = [
  {
    name: "Royal Flush",
    cards: "A♠ K♠ Q♠ J♠ 10♠",
    description: "A sequência mais forte do baralho, do 10 ao Ás, todas do mesmo naipe.",
  },
  {
    name: "Straight Flush",
    cards: "9♥ 8♥ 7♥ 6♥ 5♥",
    description: "5 cartas em sequência, todas do mesmo naipe.",
  },
  {
    name: "Quadra",
    cards: "K♣ K♦ K♥ K♠ 3♣",
    description: "4 cartas de mesmo valor, mais uma carta qualquer.",
  },
  {
    name: "Full House",
    cards: "J♠ J♥ J♦ 4♣ 4♠",
    description: "Uma trinca mais um par.",
  },
  {
    name: "Flush",
    cards: "A♦ J♦ 8♦ 6♦ 2♦",
    description: "5 cartas do mesmo naipe, fora de sequência.",
  },
  {
    name: "Sequência",
    cards: "10♠ 9♥ 8♦ 7♣ 6♠",
    description: "5 cartas em sequência, naipes variados.",
  },
  {
    name: "Trinca",
    cards: "7♣ 7♦ 7♥ K♠ 2♣",
    description: "3 cartas de mesmo valor.",
  },
  {
    name: "Dois pares",
    cards: "Q♠ Q♥ 5♦ 5♣ 9♠",
    description: "Dois pares de valores diferentes.",
  },
  {
    name: "Um par",
    cards: "8♠ 8♦ K♥ 4♣ 2♠",
    description: "Duas cartas de mesmo valor.",
  },
  {
    name: "Carta alta",
    cards: "A♠ J♥ 8♦ 5♣ 2♠",
    description: "Nenhuma combinação — vale a carta mais alta.",
  },
];

export default function HelpPage() {
  return (
    <PageContainer bottomNav>
      <PageHeader title="Mãos de poker" subtitle="Da mais forte pra mais fraca. Toque pra ver a explicação." />

      <ul className="space-y-2">
        {HANDS.map((hand, index) => (
          <Card as="li" key={hand.name} className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="flex-1">
                  <p className="text-sm font-medium text-foreground">{hand.name}</p>
                  <p className="font-mono text-xs text-muted">{hand.cards}</p>
                </span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="py-0 pr-4 pb-4 pl-13 text-sm text-muted">{hand.description}</p>
            </details>
          </Card>
        ))}
      </ul>
    </PageContainer>
  );
}
