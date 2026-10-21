import type { DiagnosisResult, Lang } from "./types";

export function demoResult(lang: Lang, symptoms?: string): DiagnosisResult {
  const symptomNote = symptoms ? ` (${symptoms.slice(0, 80)})` : "";
  if (lang === "pt") {
    return {
      plant_name: "Zamioculca",
      scientific_name: "Zamioculcas zamiifolia",
      confidence: 94,
      health_status: "attention",
      summary:
        "Sua zamioculca está bonita, mas as folhas de baixo amarelando com o solo sempre úmido indicam rega em excesso — o problema mais comum nessa espécie. A boa notícia: é fácil de corrigir.",
      issues: [
        {
          title: "Rega em excesso",
          severity: "medium",
          cause:
            "Zamioculcas guardam água nos rizomas e precisam de solo que seca entre as regas. Solo sempre úmido apodrece as raízes e amarela as folhas de baixo.",
          solution:
            "Deixe o solo secar completamente entre as regas (espete um palito: se sair úmido, espere). Regue só até escorrer um pouco pelo dreno e descarte o excesso do pratinho.",
        },
        {
          title: "Pouca luz",
          severity: "low",
          cause:
            "Folhas novas menores e abrindo devagar sugerem que ela está recebendo menos luz do que gostaria.",
          solution:
            "Aproxime-a de uma janela com luz forte indireta. Evite sol direto do meio-dia, que queima as folhas.",
        },
      ],
      care: {
        water: "A cada 15–20 dias no inverno e 7–10 dias no verão, sempre com solo seco antes.",
        light: "Luz forte indireta; tolera sombra, mas cresce mais devagar.",
        soil: "Drenagem é tudo: substrato para suculentas com perlita funciona muito bem.",
        tip: "Folhas amarelas não voltam a ser verdes — corte na base para a planta investir nas novas.",
      },
    };
  }
  return {
    plant_name: "ZZ Plant",
    scientific_name: "Zamioculcas zamiifolia",
    confidence: 94,
    health_status: "attention",
    summary:
      `Your ZZ plant looks healthy overall, but the yellowing lower leaves with consistently moist soil point to overwatering — the most common issue for this species${symptomNote}. Good news: it's easy to fix.`,
    issues: [
      {
        title: "Overwatering",
        severity: "medium",
        cause:
          "ZZ plants store water in their rhizomes and need soil to dry out between waterings. Constantly wet soil rots the roots and yellows the lower leaves.",
        solution:
          "Let the soil dry completely between waterings (stick a skewer in: if it comes out damp, wait). Water until it drains slightly, then discard the saucer excess.",
      },
      {
        title: "Low light",
        severity: "low",
        cause:
          "Smaller, slow-to-open new leaves suggest it's getting less light than it would like.",
        solution:
          "Move it near a window with bright indirect light. Avoid harsh midday sun, which scorches leaves.",
      },
    ],
    care: {
      water: "Every 15–20 days in winter, 7–10 in summer — always with dry soil in between.",
      light: "Bright indirect light; tolerates shade but grows slower.",
      soil: "Drainage is everything: a succulent mix with perlite works great.",
      tip: "Yellow leaves never turn green again — cut them at the base so the plant invests in new growth.",
    },
  };
}
