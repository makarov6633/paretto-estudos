import "dotenv/config";
import { db } from "@/lib/db";
import { item, quizQuestion } from "@/lib/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

/**
 * Este script gera 10 perguntas de quiz especializadas para cada item.
 * 
 * IMPORTANTE: As perguntas aqui são templates genéricos. Para perguntas realmente
 * especializadas sobre cada resumo, você precisa:
 * 1. Ler o conteúdo específico de cada item
 * 2. Usar IA (GPT-4/Claude) para gerar perguntas baseadas no conteúdo
 * 3. Salvar as perguntas geradas
 * 
 * Este é um seed de exemplo que mostra a estrutura de 10 perguntas.
 */

async function seedEnhancedQuiz() {
  console.log("🎯 Iniciando seed de quiz aprimorado...\n");

  const items = await db.select().from(item);

  if (items.length === 0) {
    console.log("❌ Nenhum item encontrado no banco de dados.");
    console.log("Por favor, adicione itens primeiro.");
    return;
  }

  for (const currentItem of items) {
    console.log(`\n📚 Gerando quiz para: ${currentItem.title}`);

    // Remover quizzes antigos para este item
    await db.delete(quizQuestion).where(eq(quizQuestion.itemId, currentItem.id));
    console.log("   Removido quiz antigo");

    const quizData = [
      // Questão 1: Compreensão do Conceito Principal
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 0,
        question: "Qual é o conceito central ou tese principal apresentado neste conteúdo?",
        options: JSON.stringify([
          "Um conjunto de ideias superficiais sem conexão clara",
          "Uma análise profunda focada em um conceito específico",
          "Apenas uma revisão histórica de eventos",
          "Uma coleção de opiniões pessoais do autor",
        ]),
        correctAnswer: 1,
        explanation: "O conteúdo apresenta uma análise aprofundada focada em conceitos específicos, com argumentação estruturada e evidências.",
        createdAt: new Date(),
      },

      // Questão 2: Contexto e Aplicação
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 1,
        question: "Como os conceitos apresentados podem ser aplicados na prática?",
        options: JSON.stringify([
          "Não possuem aplicação prática, são apenas teóricos",
          "Podem ser aplicados apenas em contextos acadêmicos",
          "Têm aplicação direta em situações cotidianas e profissionais",
          "São relevantes apenas para especialistas da área",
        ]),
        correctAnswer: 2,
        explanation: "Os conceitos apresentados têm aplicabilidade tanto teórica quanto prática, podendo ser utilizados em diversos contextos.",
        createdAt: new Date(),
      },

      // Questão 3: Análise Crítica
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 2,
        question: "Qual abordagem metodológica o autor utiliza para desenvolver sua argumentação?",
        options: JSON.stringify([
          "Apresenta apenas opiniões sem fundamentação",
          "Usa evidências, exemplos e raciocínio lógico estruturado",
          "Baseia-se exclusivamente em anedotas pessoais",
          "Foca apenas em citações de outros autores",
        ]),
        correctAnswer: 1,
        explanation: "O texto utiliza uma metodologia rigorosa, combinando evidências, exemplos práticos e raciocínio lógico para construir seus argumentos.",
        createdAt: new Date(),
      },

      // Questão 4: Implicações e Consequências
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 3,
        question: "Quais são as principais implicações dos conceitos discutidos?",
        options: JSON.stringify([
          "Não há implicações significativas",
          "Afetam apenas um campo específico do conhecimento",
          "Têm implicações interdisciplinares e multifacetadas",
          "São relevantes apenas historicamente",
        ]),
        correctAnswer: 2,
        explanation: "Os conceitos apresentados têm implicações que transcendem uma única disciplina, influenciando múltiplas áreas do conhecimento.",
        createdAt: new Date(),
      },

      // Questão 5: Comparação e Contraste
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 4,
        question: "Como este conteúdo se relaciona com outras abordagens ou teorias na área?",
        options: JSON.stringify([
          "É completamente isolado de outras teorias",
          "Dialoga, complementa ou contesta outras perspectivas",
          "Simplesmente repete o que já foi dito antes",
          "Ignora completamente o contexto teórico existente",
        ]),
        correctAnswer: 1,
        explanation: "O conteúdo estabelece diálogo com outras teorias e abordagens, posicionando-se de forma crítica e contributiva no campo.",
        createdAt: new Date(),
      },

      // Questão 6: Evidências e Suporte
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 5,
        question: "Que tipo de evidências são utilizadas para sustentar os argumentos principais?",
        options: JSON.stringify([
          "Nenhuma evidência concreta é apresentada",
          "Combinação de dados empíricos, estudos de caso e análise teórica",
          "Apenas especulação e hipóteses não testadas",
          "Exclusivamente evidências anedóticas",
        ]),
        correctAnswer: 1,
        explanation: "O texto fundamenta seus argumentos em uma base sólida de evidências diversificadas, incluindo dados, casos práticos e análise teórica.",
        createdAt: new Date(),
      },

      // Questão 7: Limitações e Críticas
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 6,
        question: "Quais são as potenciais limitações ou pontos de crítica da abordagem apresentada?",
        options: JSON.stringify([
          "Não há limitações, a abordagem é perfeita",
          "Pode ter alcance limitado em certos contextos ou necessitar validação adicional",
          "As limitações tornam todo o conteúdo irrelevante",
          "Não é possível identificar limitações",
        ]),
        correctAnswer: 1,
        explanation: "Como qualquer abordagem acadêmica, este conteúdo possui limitações específicas e áreas que necessitam de desenvolvimento ou validação adicional.",
        createdAt: new Date(),
      },

      // Questão 8: Síntese e Integração
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 7,
        question: "Como os diferentes elementos do conteúdo se integram para formar um argumento coeso?",
        options: JSON.stringify([
          "Os elementos estão desconexos e não formam um todo coerente",
          "Há uma estrutura lógica que conecta introdução, desenvolvimento e conclusão",
          "Apenas alguns elementos se conectam, o resto é aleatório",
          "Não há estrutura identificável",
        ]),
        correctAnswer: 1,
        explanation: "O conteúdo apresenta uma arquitetura argumentativa bem estruturada, onde cada elemento contribui para o argumento geral.",
        createdAt: new Date(),
      },

      // Questão 9: Relevância Contemporânea
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 8,
        question: "Qual é a relevância deste conteúdo para questões e desafios contemporâneos?",
        options: JSON.stringify([
          "É completamente desatualizado e irrelevante",
          "Oferece insights valiosos para compreender e abordar questões atuais",
          "É relevante apenas para o período em que foi escrito",
          "Não tem conexão com a realidade contemporânea",
        ]),
        correctAnswer: 1,
        explanation: "O conteúdo mantém relevância contemporânea ao fornecer frameworks e perspectivas aplicáveis aos desafios atuais.",
        createdAt: new Date(),
      },

      // Questão 10: Pensamento Crítico Avançado
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 9,
        question: "Ao avaliar criticamente este conteúdo, qual seria a contribuição mais significativa para sua área de conhecimento?",
        options: JSON.stringify([
          "Não oferece nenhuma contribuição significativa",
          "Apresenta novas perspectivas, métodos ou sínteses que avançam o campo",
          "Apenas resume o que já era conhecido",
          "A contribuição é insignificante",
        ]),
        correctAnswer: 1,
        explanation: "A principal contribuição está em oferecer novas perspectivas, métodos de análise ou sínteses que fazem avançar a compreensão do campo.",
        createdAt: new Date(),
      },
    ];

    await db.insert(quizQuestion).values(quizData);
    console.log(`   ✅ Criadas ${quizData.length} perguntas especializadas`);
  }

  console.log("\n\n🎉 Seed de quiz aprimorado concluído com sucesso!");
  console.log("\n💡 NOTA IMPORTANTE:");
  console.log("   Para perguntas verdadeiramente especializadas sobre cada resumo,");
  console.log("   considere usar IA para gerar perguntas baseadas no conteúdo específico.");
  console.log("   Este script fornece um template genérico de 10 perguntas por item.\n");
}

seedEnhancedQuiz()
  .catch((error) => {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
