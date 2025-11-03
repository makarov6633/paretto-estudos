export type PartialItem = {
  slug: string;
  title: string;
  author: string;
  coverImageUrl?: string | null;
  pdfUrl?: string | null;
  hasPdf?: boolean;
};

// Manual, explicit corrections requested by the user.
export const CORRECTIONS: Record<string, Partial<PartialItem>> = {
  // Sapolsky — Determined
  "determined-resumo-completo-final": {
    title: "Determined: Uma ciência da vida sem livre-arbítrio",
    author: "Robert M. Sapolsky",
    coverImageUrl: "/media/covers/determined-resumo-completo-final.jpg",
  },
  // Mark Manson
  "a-sutil-arte-resumo-dissertativo": {
    title: "A Sutil Arte de Ligar o Foda-se",
    author: "Mark Manson",
    coverImageUrl: "/media/covers/a-sutil-arte-resumo-dissertativo.jpg",
  },
  // Renato Alves
  "faca-seu-cerebro-trabalhar-para-voce": {
    title: "Faça seu Cérebro Trabalhar para Você",
    author: "Renato Alves",
    coverImageUrl: "/media/covers/faca-seu-cerebro-trabalhar-para-voce.jpg",
  },
  // Oxford
  "oxford-handbook-psychology": {
    title: "Manual Oxford de Psicologia",
    author: "Diversos autores",
    coverImageUrl: "/media/covers/oxford-handbook-psychology.jpg",
  },
  // Sapolsky — Stress
  "stress-and-your-body-sapolsky": {
    title: "Estresse e Seu Corpo",
    author: "Robert M. Sapolsky",
    coverImageUrl: "/media/covers/stress-and-your-body-sapolsky.jpg",
  },
  // Encoding fixes and author corrections (PT-BR)
  "resumo-hawking-breve-historia-tempo": {
    title: "Uma Breve História do Tempo",
    author: "Stephen Hawking",
    coverImageUrl: "/media/covers/resumo-hawking-breve-historia-tempo.jpg",
  },
  "o-homem-e-seus-simbolos-dissertativo-final": {
    title: "O Homem e Seus Símbolos",
    author:
      "Carl G. Jung; Joseph L. Henderson; Aniela Jaffé; Marie‑Louise von Franz",
    coverImageUrl:
      "/media/covers/o-homem-e-seus-simbolos-dissertativo-final.jpg",
  },
  "pense-e-enriqueca-otimizado": {
    title: "Pense e Enriqueça",
    author: "Napoleon Hill",
    coverImageUrl: "/media/covers/pense-e-enriqueca-otimizado.jpg",
  },
  "pai-rico-pai-pobre-resumo-dissertativo": {
    title: "Pai Rico, Pai Pobre",
    author: "Robert Kiyosaki",
    coverImageUrl: "/media/covers/pai-rico-pai-pobre-resumo-dissertativo.jpg",
  },
  "pai-rico-pai-pobre-resumo-completo": {
    title: "Pai Rico, Pai Pobre",
    author: "Robert Kiyosaki",
    coverImageUrl: "/media/covers/pai-rico-pai-pobre-resumo-completo.jpg",
  },
  "pai-rico-pai-pobre-resumo-completo-30-paginas": {
    title: "Pai Rico, Pai Pobre",
    author: "Robert Kiyosaki",
    coverImageUrl:
      "/media/covers/pai-rico-pai-pobre-resumo-completo-30-paginas.jpg",
  },
  "talvez-voce-deva-conversar-com-alguem-resumo-profissional-expandido": {
    title: "Talvez Você Deva Conversar com Alguém",
    author: "Lori Gottlieb",
    coverImageUrl:
      "/media/covers/talvez-voce-deva-conversar-com-alguem-resumo-profissional-expandido.jpg",
  },
  "gestalt-terapia-fundamentos-reorganizado": {
    title:
      "Gestalt‑terapia: Fundamentos Epistemológicos e Influências Filosóficas",
    author: "Roberto Peres Veras (org.)",
    coverImageUrl: "/media/covers/gestalt-terapia-fundamentos-reorganizado.jpg",
  },
  "freud-fundamentos-clinica-reestruturado": {
    title: "Fundamentos da Clínica Psicanalítica",
    author: "Sigmund Freud",
    coverImageUrl: "/media/covers/freud-fundamentos-clinica-reestruturado.jpg",
  },
  "cem-anos-solidao-resumo-95-por-cento-final": {
    title: "Cem Anos de Solidão",
    author: "Gabriel García Márquez",
    coverImageUrl:
      "/media/covers/cem-anos-solidao-resumo-95-por-cento-final.jpg",
  },
  "habitos-atomicos-james-clear": {
    title: "Hábitos Atômicos",
    author: "James Clear",
    coverImageUrl: "/media/covers/habitos-atomicos-james-clear.jpg",
  },
  "martin-heidegger-psicologia-existencial-resumo-padronizado": {
    title: "Ética e Existência em Martin Heidegger",
    author: "Thalles Azevedo de Araujo",
    coverImageUrl:
      "/media/covers/martin-heidegger-psicologia-existencial-resumo-padronizado.jpg",
  },
  "brasil-uma-historia": {
    title: "Brasil, Uma História Popular",
    author: "Rubim Santos Leão de Aquino",
    coverImageUrl: "/media/covers/brasil-uma-historia.jpg",
  },
  "psicanalise-de-boteco": {
    title: "Psicanálise de Boteco",
    author: "Alexandre Patricio de Almeida",
    coverImageUrl: "/media/covers/psicanalise-de-boteco.jpg",
  },
  "handbook-psicologia-completo-dissertativo-2": {
    title: "Personalidade e psicologia social",
    author: "Fonseca, César; Lopes, Manuel José (orgs.)",
    coverImageUrl:
      "/media/covers/handbook-psicologia-completo-dissertativo-2.png",
  },
  "o-cerebro-no-esporte-reestruturado": {
    title: "O Cérebro no Esporte",
    author: "David Grand; Alan Goldberg",
    coverImageUrl: "/media/covers/o-cerebro-no-esporte-reestruturado.png",
  },
  "a-sensacao-de-estar-sendo-observado-padronizado": {
    title: "Sensação de Estar Sendo Observado, A",
    author: "Desconhecido",
    coverImageUrl:
      "/media/covers/a-sensacao-de-estar-sendo-observado-padronizado.jpg",
  },
  "me-poupe-10-passos-resumo-final": {
    title: "Me Poupe! (Edição Atualizada)",
    author: "Nathalia Arcuri",
    coverImageUrl: "/media/covers/me-poupe-10-passos-resumo-final.jpg",
  },
  "o-eu-e-o-inconsciente-jung-formatado": {
    title: "Estudos Sobre Psicologia Analítica",
    author: "Carl G. Jung",
    coverImageUrl: "/media/covers/o-eu-e-o-inconsciente-jung-formatado.jpg",
  },
  "o-capital-volume-i": {
    title: "O Capital - Livro 1 - Capítulo 1",
    author: "Karl Marx",
    coverImageUrl: "/media/covers/o-capital-volume-i.jpg",
  },
  "um-apelo-consciencia-resumo-profissional": {
    title: "Um Apelo à Consciência",
    author: "Martin Luther King Jr.",
    coverImageUrl: "/media/covers/um-apelo-consciencia-resumo-profissional.jpg",
  },
  "psicologia-neurociencias": {
    title: "Psicología y Neurociencias Jurídicas",
    author: "Francisco J. Ferrer Arroyo",
    coverImageUrl: "/media/covers/psicologia-neurociencias.jpg",
  },
  "psicodiagnostico-reorganizado": {
    title: "Psicodiagnóstico Clínico Infantil",
    author: "Maria Vives Gomila",
    coverImageUrl: "/media/covers/psicodiagnostico-reorganizado.jpg",
  },
  "manual-de-psicopatologia": {
    title: "Manual De Psicopatología",
    author: "Fernando Colina; Laura Martín",
    coverImageUrl: "/media/covers/manual-de-psicopatologia.jpg",
  },
  "o-poder-do-habito-resumo-profissional": {
    title: "O Poder do Hábito",
    author: "Charles Duhigg",
    coverImageUrl: "/media/covers/o-poder-do-habito-resumo-profissional.jpg",
  },
  microbiologia: {
    title: "Microbiologia Médica",
    author: "Patrick R. Murray; George S. Kobayashi; Michael A. Pfaller",
    coverImageUrl: "/media/covers/microbiologia.jpg",
  },
  "resumo-fique-onde-esta": {
    title: "Fique Onde Está e Então Corra",
    author: "John Boyne",
    coverImageUrl: "/media/covers/resumo-fique-onde-esta.jpg",
  },
  // Traduções/ajustes de títulos temáticos
  "why-language-models-hallucinate-final": {
    title: "Por que Modelos de Linguagem Alucinam",
    author: "—",
    coverImageUrl: "/media/covers/why-language-models-hallucinate-final.jpg",
  },
  "global-inequality": {
    title: "Desigualdade Global",
    author: "—",
    coverImageUrl: "/media/covers/global-inequality.jpg",
  },
  // Correções adicionais identificadas
  "freud-interpretacao-sonhos-final": {
    title: "A Interpretação dos Sonhos",
    author: "Sigmund Freud",
    coverImageUrl: "/media/covers/freud-interpretacao-sonhos-final.jpg",
  },
  "plantas-medicinais-viva-mais-e-melhor": {
    title: "Plantas Medicinais",
    author: "Sandro Kanzler",
    coverImageUrl: "/media/covers/plantas-medicinais-viva-mais-e-melhor.jpg",
  },
  "capitalism-and-freedom": {
    title: "Capitalismo e Liberdade",
    author: "Milton Friedman",
    coverImageUrl: "/media/covers/capitalism-and-freedom.jpg",
  },
  "the-obstacle-is-the-way": {
    title: "O Obstáculo é o Caminho",
    author: "Ryan Holiday",
    coverImageUrl: "/media/covers/the-obstacle-is-the-way.jpg",
  },
  "john-bowlby-teoria-apego-padronizado": {
    title: "Uma Base Segura",
    author: "John Bowlby",
    coverImageUrl: "/media/covers/john-bowlby-teoria-apego-padronizado.jpg",
  },
  "a-mente-de-adolf-hitler-completo-final": {
    title: "A Mente de Adolf Hitler",
    author: "Walter C. Langer",
    coverImageUrl: "/media/covers/a-mente-de-adolf-hitler-completo-final.jpg",
  },
  "mulheres-que-amam-demais-padronizado-final": {
    title: "Mulheres Que Amam Demais",
    author: "Robin Norwood",
    coverImageUrl:
      "/media/covers/mulheres-que-amam-demais-padronizado-final.jpg",
  },
  "free-to-choose-padronizado": {
    title: "Livre para Escolher",
    author: "Milton Friedman; Rose D. Friedman",
    coverImageUrl: "/media/covers/free-to-choose-padronizado.jpg",
  },
  "a-teoria-do-amadurecimento-corrigido": {
    title: "A Teoria do Amadurecimento de D. W. Winnicott",
    author: "Elsa Oliveira Dias",
    coverImageUrl: "/media/covers/a-teoria-do-amadurecimento-corrigido.jpg",
  },
  "a-estranha-vida-de-nikola-tesla": {
    title: "A Estranha Vida de Nikola Tesla",
    author: "Nikola Tesla",
    coverImageUrl: "/media/covers/a-estranha-vida-de-nikola-tesla.jpg",
  },
  "behave-corrigido": {
    title: "Behave: A Biologia dos Humanos em seu Melhor e Pior",
    author: "Robert M. Sapolsky",
    coverImageUrl: "/media/covers/behave-corrigido.jpg",
  },
  "tornar-se-pessoa-rogers-formatado": {
    title: "Tornar-se Pessoa",
    author: "Carl R. Rogers",
    coverImageUrl: "/media/covers/tornar-se-pessoa-rogers-formatado.jpg",
  },
  "terapia-cognitivo-comportamental-para-iniciantes": {
    title: "Essencial da Terapia Cognitivo-Comportamental",
    author: "Diego Falco",
    coverImageUrl:
      "/media/covers/terapia-cognitivo-comportamental-para-iniciantes.jpg",
  },
  "manifesto-comunista": {
    title: "O Manifesto Comunista",
    author: "Karl Marx; Friedrich Engels",
    coverImageUrl: "/media/covers/manifesto-comunista.jpg",
  },
  "completo-epigenetica": {
    title: "Epigenética: Como o Ambiente Influencia os Genes",
    author: "Joel de Rosnay",
    coverImageUrl: "/media/covers/completo-epigenetica.jpg",
  },
  "e-o-cerebro-criou-o-homem-reorganizado": {
    title: "E o Cérebro Criou o Homem",
    author: "Antonio R. Damasio",
    coverImageUrl: "/media/covers/e-o-cerebro-criou-o-homem-reorganizado.jpg",
  },
  "teorias-personalidade-padronizado": {
    title: "Teorias da Personalidade",
    author: "Duane P. Schultz",
    coverImageUrl: "/media/covers/teorias-personalidade-padronizado.jpg",
  },
  "teorias-da-personalidade-otimizado": {
    title: "Teorias da Personalidade - 4ª Edição",
    author: "Calvin S. Hall; Gardner Lindzey; John B. Campbell",
    coverImageUrl: "/media/covers/teorias-da-personalidade-otimizado.jpg",
  },
  "psicopatologia-reorganizada": {
    title: "Psicopatologia",
    author: "Richardson Miranda (org.)",
    coverImageUrl: "/media/covers/psicopatologia-reorganizada.jpg",
  },
};

// Manual mapping to collapse duplicates; key=duplicate, value=canonical slug to keep
export const CANONICAL: Record<string, string> = {
  "resumo-o-capital-completo-final": "o-capital-volume-i",
  "pai-rico-pai-pobre-resumo-completo":
    "pai-rico-pai-pobre-resumo-dissertativo",
  "pai-rico-pai-pobre-resumo-completo-30-paginas":
    "pai-rico-pai-pobre-resumo-dissertativo",
};

export function applyManualCorrections<T extends PartialItem>(rows: T[]): T[] {
  return rows.map((r) => {
    const fix = CORRECTIONS[r.slug];
    if (!fix) return r;
    return { ...r, ...fix } as T;
  });
}

export function filterManualDuplicates<T extends PartialItem>(rows: T[]): T[] {
  // Drop any row that is explicitly mapped to a canonical slug when that canonical exists
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const keep = new Set<string>();
  for (const r of rows) {
    const canon = CANONICAL[r.slug];
    if (canon && bySlug.has(canon)) continue; // drop this duplicate
    keep.add(r.slug);
  }
  return rows.filter((r) => keep.has(r.slug));
}
