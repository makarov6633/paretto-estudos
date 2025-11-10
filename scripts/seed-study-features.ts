import "dotenv/config";
import { db } from "@/lib/db";
import { item, checklist, quizQuestion } from "@/lib/schema";
import { nanoid } from "nanoid";

async function seedStudyFeatures() {
  console.log("Starting study features seed...");

  const items = await db.select().from(item).limit(5);

  if (items.length === 0) {
    console.log("No items found in database. Please add items first.");
    return;
  }

  for (const currentItem of items) {
    console.log(`\nSeeding study features for: ${currentItem.title}`);

    const checklistData = [
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 0,
        title: "Ler o resumo completo",
        description: "Faça uma leitura atenta de todo o conteúdo",
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 1,
        title: "Identificar conceitos principais",
        description: "Liste os conceitos mais importantes do texto",
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 2,
        title: "Fazer anotações pessoais",
        description: "Registre suas reflexões e insights",
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 3,
        title: "Responder o quiz",
        description: "Teste seu conhecimento sobre o conteúdo",
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 4,
        title: "Revisar pontos fracos",
        description: "Revise os tópicos que teve dificuldade",
        createdAt: new Date(),
      },
    ];

    await db.insert(checklist).values(checklistData);
    console.log(`✓ Created ${checklistData.length} checklist items`);

    const quizData = [
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 0,
        question: "Qual é o tema central abordado neste resumo?",
        options: JSON.stringify([
          "Conceitos fundamentais e suas aplicações",
          "História e contexto histórico",
          "Análise crítica e comparações",
          "Metodologias e técnicas específicas",
        ]),
        correctAnswer: 0,
        explanation: "O resumo foca principalmente nos conceitos fundamentais e como eles são aplicados na prática.",
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 1,
        question: "Qual das seguintes afirmações melhor resume o conteúdo?",
        options: JSON.stringify([
          "Apresenta uma visão superficial do tema",
          "Oferece uma análise profunda e estruturada",
          "Foca apenas em aspectos teóricos",
          "Prioriza exemplos práticos sem teoria",
        ]),
        correctAnswer: 1,
        explanation: "O resumo oferece uma análise profunda e bem estruturada, equilibrando teoria e prática.",
        createdAt: new Date(),
      },
      {
        id: nanoid(),
        itemId: currentItem.id,
        orderIndex: 2,
        question: "Qual é a principal contribuição deste conteúdo?",
        options: JSON.stringify([
          "Apresentar informações básicas",
          "Desenvolver pensamento crítico sobre o tema",
          "Listar fatos históricos",
          "Fornecer entretenimento",
        ]),
        correctAnswer: 1,
        explanation: "O principal objetivo é desenvolver o pensamento crítico e aprofundar o entendimento do tema.",
        createdAt: new Date(),
      },
    ];

    await db.insert(quizQuestion).values(quizData);
    console.log(`✓ Created ${quizData.length} quiz questions`);
  }

  console.log("\n✅ Study features seed completed successfully!");
}

seedStudyFeatures()
  .catch((error) => {
    console.error("Error seeding study features:", error);
    process.exit(1);
  });
