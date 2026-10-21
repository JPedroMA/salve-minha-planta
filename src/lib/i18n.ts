import type { Lang } from "./types";

const dict = {
  pt: {
    tagline: "Diagnóstico de plantas com IA",
    heading1: "Sua planta está",
    heading2: "pedindo socorro?",
    sub: "Envie uma foto e receba em segundos o diagnóstico: identificação, problemas e um plano de cuidados — direto ao ponto, sem jargão.",
    uploadTitle: "Solte a foto da sua planta aqui",
    uploadHint: "ou clique para escolher · tire a foto de perto, com as folhas visíveis",
    uploadMobile: "Tirar foto ou escolher da galeria",
    changePhoto: "Trocar foto",
    symptomsLabel: "O que você observa? (opcional)",
    symptomsPlaceholder:
      "Ex.: as folhas de baixo estão amarelando e caem, tem uns pontinhos brancos no verso das folhas…",
    analyze: "Analisar minha planta",
    analyzing: "Analisando…",
    scanMessages: [
      "Analisando folhas e coloração…",
      "Verificando sinais de pragas…",
      "Comparando com milhares de espécies…",
      "Montando o plano de cuidados…",
    ],
    analyzingSub: "Isso leva alguns segundos. A foto não é salva.",
    demoBadge: "modo demonstração — configure GEMINI_API_KEY para análise real",
    plantLabel: "planta identificada",
    confidence: "confiança",
    health: {
      healthy: "Saudável",
      attention: "Precisa de atenção",
      critical: "Crítico",
    },
    summaryLabel: "resumo",
    issuesLabel: "problemas encontrados",
    noIssues: "Nenhum problema identificado. Continue com os cuidados abaixo.",
    severity: { low: "leve", medium: "médio", high: "grave" },
    cause: "Por que acontece",
    solution: "Como resolver",
    careLabel: "plano de cuidados",
    care: {
      water: "Água",
      light: "Luz",
      soil: "Solo",
      tip: "Dica de ouro",
    },
    analyzeAnother: "Analisar outra planta",
    stats: {
      analyses: "plantas analisadas",
      issuesFound: "problemas identificados",
    },
    footer:
      "Feito com IA · As fotos são processadas na hora e nunca armazenadas · Confira sempre um especialista em caso de dúvida",
    error: {
      generic: "Não consegui analisar agora. Tenta de novo em instantes.",
      rate: "Muitas análises seguidas. Aguarde um pouco e tente novamente.",
      invalid: "Envie uma foto de planta válida (JPG, PNG ou WebP).",
    },
  },
  en: {
    tagline: "AI-powered plant diagnosis",
    heading1: "Is your plant",
    heading2: "crying for help?",
    sub: "Send a photo and get a diagnosis in seconds: identification, problems and a care plan — straight to the point, no jargon.",
    uploadTitle: "Drop your plant photo here",
    uploadHint: "or click to choose · shoot up close, with the leaves visible",
    uploadMobile: "Take a photo or choose from gallery",
    changePhoto: "Change photo",
    symptomsLabel: "What do you observe? (optional)",
    symptomsPlaceholder:
      "e.g. bottom leaves are turning yellow and falling off, there are tiny white dots on the underside of the leaves…",
    analyze: "Diagnose my plant",
    analyzing: "Analyzing…",
    scanMessages: [
      "Analyzing leaves and coloring…",
      "Checking for signs of pests…",
      "Matching against thousands of species…",
      "Building the care plan…",
    ],
    analyzingSub: "This takes a few seconds. The photo is never saved.",
    demoBadge: "demo mode — set GEMINI_API_KEY for real analysis",
    plantLabel: "identified plant",
    confidence: "confidence",
    health: {
      healthy: "Healthy",
      attention: "Needs attention",
      critical: "Critical",
    },
    summaryLabel: "summary",
    issuesLabel: "issues found",
    noIssues: "No issues identified. Keep up the care below.",
    severity: { low: "mild", medium: "moderate", high: "severe" },
    cause: "Why it happens",
    solution: "How to fix it",
    careLabel: "care plan",
    care: {
      water: "Water",
      light: "Light",
      soil: "Soil",
      tip: "Pro tip",
    },
    analyzeAnother: "Diagnose another plant",
    stats: {
      analyses: "plants analyzed",
      issuesFound: "issues identified",
    },
    footer:
      "Powered by AI · Photos are processed on the fly and never stored · Always confirm with a specialist if in doubt",
    error: {
      generic: "I couldn't analyze right now. Try again in a moment.",
      rate: "Too many analyses in a row. Please wait a bit and try again.",
      invalid: "Please send a valid plant photo (JPG, PNG or WebP).",
    },
  },
};

export type Dict = (typeof dict)["pt"];

export function t(lang: Lang): Dict {
  return dict[lang];
}
