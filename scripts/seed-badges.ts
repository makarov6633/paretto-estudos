import "dotenv/config";
import { db } from "@/lib/db";
import { badgeDefinition } from "@/lib/schema";
import { nanoid } from "nanoid";

const badges = [
  // Milestone Badges - Points
  {
    id: nanoid(),
    name: "Primeiro Passo",
    description: "Ganhe seus primeiros 100 pontos",
    icon: "🌟",
    category: "milestone",
    requirement: { type: "points", value: 100 },
    points: 50,
    rarity: "common",
  },
  {
    id: nanoid(),
    name: "Estudante Dedicado",
    description: "Acumule 500 pontos",
    icon: "📚",
    category: "milestone",
    requirement: { type: "points", value: 500 },
    points: 100,
    rarity: "common",
  },
  {
    id: nanoid(),
    name: "Expert em Aprendizado",
    description: "Alcance 1000 pontos",
    icon: "🎓",
    category: "milestone",
    requirement: { type: "points", value: 1000 },
    points: 200,
    rarity: "rare",
  },
  {
    id: nanoid(),
    name: "Mestre do Conhecimento",
    description: "Conquiste 2500 pontos",
    icon: "👑",
    category: "milestone",
    requirement: { type: "points", value: 2500 },
    points: 500,
    rarity: "epic",
  },
  {
    id: nanoid(),
    name: "Lenda Paretto",
    description: "Atinja 5000 pontos",
    icon: "⭐",
    category: "milestone",
    requirement: { type: "points", value: 5000 },
    points: 1000,
    rarity: "legendary",
  },

  // Streak Badges
  {
    id: nanoid(),
    name: "Consistência",
    description: "Estude por 3 dias consecutivos",
    icon: "🔥",
    category: "streak",
    requirement: { type: "streak", value: 3 },
    points: 50,
    rarity: "common",
  },
  {
    id: nanoid(),
    name: "Semana de Foco",
    description: "Mantenha uma sequência de 7 dias",
    icon: "💪",
    category: "streak",
    requirement: { type: "streak", value: 7 },
    points: 150,
    rarity: "rare",
  },
  {
    id: nanoid(),
    name: "Duas Semanas Intensas",
    description: "Estude por 14 dias seguidos",
    icon: "🚀",
    category: "streak",
    requirement: { type: "streak", value: 14 },
    points: 300,
    rarity: "epic",
  },
  {
    id: nanoid(),
    name: "Mês Imparável",
    description: "Complete 30 dias consecutivos",
    icon: "💎",
    category: "streak",
    requirement: { type: "streak", value: 30 },
    points: 750,
    rarity: "legendary",
  },

  // Achievement Badges - Quizzes
  {
    id: nanoid(),
    name: "Questionador",
    description: "Complete 5 quizzes",
    icon: "🧠",
    category: "achievement",
    requirement: { type: "quizzes", value: 5 },
    points: 75,
    rarity: "common",
  },
  {
    id: nanoid(),
    name: "Mestre dos Quizzes",
    description: "Complete 25 quizzes",
    icon: "🎯",
    category: "achievement",
    requirement: { type: "quizzes", value: 25 },
    points: 250,
    rarity: "rare",
  },
  {
    id: nanoid(),
    name: "Quiz Champion",
    description: "Complete 50 quizzes",
    icon: "🏆",
    category: "achievement",
    requirement: { type: "quizzes", value: 50 },
    points: 500,
    rarity: "epic",
  },

  // Achievement Badges - Reading
  {
    id: nanoid(),
    name: "Leitor Iniciante",
    description: "Leia 5 resumos completos",
    icon: "📖",
    category: "achievement",
    requirement: { type: "itemsRead", value: 5 },
    points: 75,
    rarity: "common",
  },
  {
    id: nanoid(),
    name: "Devorador de Livros",
    description: "Leia 20 resumos",
    icon: "📚",
    category: "achievement",
    requirement: { type: "itemsRead", value: 20 },
    points: 200,
    rarity: "rare",
  },
  {
    id: nanoid(),
    name: "Biblioteca Viva",
    description: "Leia 50 resumos",
    icon: "🗿",
    category: "achievement",
    requirement: { type: "itemsRead", value: 50 },
    points: 600,
    rarity: "epic",
  },

  // Achievement Badges - Checklists
  {
    id: nanoid(),
    name: "Organizador",
    description: "Complete 10 itens de checklist",
    icon: "✅",
    category: "achievement",
    requirement: { type: "checklistsCompleted", value: 10 },
    points: 50,
    rarity: "common",
  },
  {
    id: nanoid(),
    name: "Planejador Expert",
    description: "Complete 50 itens de checklist",
    icon: "📋",
    category: "achievement",
    requirement: { type: "checklistsCompleted", value: 50 },
    points: 200,
    rarity: "rare",
  },

  // Achievement Badges - Notes
  {
    id: nanoid(),
    name: "Anotador",
    description: "Crie 10 notas",
    icon: "📝",
    category: "achievement",
    requirement: { type: "notesCreated", value: 10 },
    points: 50,
    rarity: "common",
  },
  {
    id: nanoid(),
    name: "Escritor Dedicado",
    description: "Crie 50 notas",
    icon: "✍️",
    category: "achievement",
    requirement: { type: "notesCreated", value: 50 },
    points: 250,
    rarity: "rare",
  },

  // Special Badges
  {
    id: nanoid(),
    name: "Perfeccionista",
    description: "Acerte todas as questões de um quiz",
    icon: "💯",
    category: "special",
    requirement: { type: "perfect_quiz", value: 1 },
    points: 100,
    rarity: "rare",
  },
  {
    id: nanoid(),
    name: "Madrugador",
    description: "Estude antes das 6h da manhã",
    icon: "🌅",
    category: "special",
    requirement: { type: "early_bird", value: 1 },
    points: 50,
    rarity: "rare",
  },
  {
    id: nanoid(),
    name: "Coruja",
    description: "Estude depois da meia-noite",
    icon: "🦉",
    category: "special",
    requirement: { type: "night_owl", value: 1 },
    points: 50,
    rarity: "rare",
  },
];

async function seedBadges() {
  console.log("🏅 Seeding badges...");

  try {
    // Check if badges already exist
    const existing = await db.select().from(badgeDefinition).limit(1);
    
    if (existing.length > 0) {
      console.log("⚠️  Badges already exist, skipping seed");
      return;
    }

    await db.insert(badgeDefinition).values(
      badges.map((badge) => ({
        ...badge,
        requirement: JSON.stringify(badge.requirement),
        createdAt: new Date(),
      }))
    );

    console.log(`✅ Successfully seeded ${badges.length} badges!`);
    console.log("\nBadges by rarity:");
    console.log("  Common:", badges.filter((b) => b.rarity === "common").length);
    console.log("  Rare:", badges.filter((b) => b.rarity === "rare").length);
    console.log("  Epic:", badges.filter((b) => b.rarity === "epic").length);
    console.log("  Legendary:", badges.filter((b) => b.rarity === "legendary").length);
  } catch (error) {
    console.error("❌ Error seeding badges:", error);
    throw error;
  }
}

seedBadges();
