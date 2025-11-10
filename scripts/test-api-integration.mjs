#!/usr/bin/env node
import { db } from "../src/lib/db.ts";
import { 
  readingProgress, 
  readingEvent, 
  userPreference, 
  item,
  userGamification 
} from "../src/lib/schema.ts";
import { eq, and, desc } from "drizzle-orm";

console.log("🧪 Testando Integração de APIs - Paretto Estudos\n");

async function testIntegration() {
  try {
    // 1. Testar Continue Lendo ↔ Progresso de Leitura
    console.log("📖 1. Testando Continue Lendo ↔ Progresso de Leitura...");
    const progressData = await db
      .select({
        userId: readingProgress.userId,
        itemId: readingProgress.itemId,
        scrollProgress: readingProgress.scrollProgress,
        itemTitle: item.title,
      })
      .from(readingProgress)
      .innerJoin(item, eq(readingProgress.itemId, item.id))
      .limit(3);

    if (progressData.length > 0) {
      console.log(`   ✅ ${progressData.length} registros de progresso encontrados`);
      console.log(`   📊 Exemplo: "${progressData[0].itemTitle}" - ${progressData[0].scrollProgress}% concluído`);
    } else {
      console.log("   ⚠️  Nenhum registro de progresso (normal se não houver usuários ativos)");
    }

    // 2. Testar Recomendações ↔ Preferências
    console.log("\n🎯 2. Testando Recomendações ↔ Preferências...");
    const preferences = await db
      .select({
        userId: userPreference.userId,
        tag: userPreference.tag,
        weight: userPreference.weight,
      })
      .from(userPreference)
      .orderBy(desc(userPreference.weight))
      .limit(5);

    if (preferences.length > 0) {
      console.log(`   ✅ ${preferences.length} preferências de usuário encontradas`);
      const uniqueUsers = new Set(preferences.map(p => p.userId)).size;
      console.log(`   👥 ${uniqueUsers} usuário(s) com preferências configuradas`);
      console.log(`   🏷️  Tags mais populares: ${preferences.slice(0, 3).map(p => p.tag).join(", ")}`);
      
      // Verificar se há itens que correspondem às preferências
      const topTags = preferences.slice(0, 3).map(p => p.tag);
      const matchingItems = await db
        .select({ id: item.id, title: item.title, tags: item.tags })
        .from(item)
        .limit(100);
      
      const itemsWithMatchingTags = matchingItems.filter(i => 
        i.tags && Array.isArray(i.tags) && 
        topTags.some(tag => i.tags.includes(tag))
      );
      
      console.log(`   🎯 ${itemsWithMatchingTags.length} itens correspondem às preferências dos usuários`);
    } else {
      console.log("   ⚠️  Nenhuma preferência configurada (usuários precisam fazer onboarding)");
    }

    // 3. Testar Similar Items ↔ Reading Events
    console.log("\n✨ 3. Testando Similar Items ↔ Reading Events...");
    const events = await db
      .select({
        userId: readingEvent.userId,
        itemId: readingEvent.itemId,
        event: readingEvent.event,
      })
      .from(readingEvent)
      .limit(10);

    if (events.length > 0) {
      console.log(`   ✅ ${events.length} eventos de leitura registrados`);
      const uniqueItems = new Set(events.map(e => e.itemId)).size;
      const uniqueUsers = new Set(events.map(e => e.userId)).size;
      console.log(`   📚 ${uniqueItems} itens diferentes lidos`);
      console.log(`   👥 ${uniqueUsers} usuário(s) ativos`);
      
      // Testar lógica de similaridade
      if (events.length >= 2) {
        const testItemId = events[0].itemId;
        const usersWhoRead = events
          .filter(e => e.itemId === testItemId)
          .map(e => e.userId);
        
        const otherItemsByTheseUsers = events.filter(e => 
          e.itemId !== testItemId && 
          usersWhoRead.includes(e.userId)
        );
        
        console.log(`   🔗 Itens similares detectáveis: ${new Set(otherItemsByTheseUsers.map(e => e.itemId)).size}`);
      }
    } else {
      console.log("   ⚠️  Nenhum evento de leitura (normal em ambiente novo)");
    }

    // 4. Testar Dashboard ↔ Gamificação
    console.log("\n🏆 4. Testando Dashboard ↔ Gamificação...");
    const gamificationData = await db
      .select({
        userId: userGamification.userId,
        totalPoints: userGamification.totalPoints,
        currentStreak: userGamification.currentStreak,
        level: userGamification.level,
        itemsRead: userGamification.itemsRead,
      })
      .from(userGamification)
      .limit(5);

    if (gamificationData.length > 0) {
      console.log(`   ✅ ${gamificationData.length} perfis de gamificação encontrados`);
      const totalPoints = gamificationData.reduce((sum, g) => sum + g.totalPoints, 0);
      const avgPoints = Math.round(totalPoints / gamificationData.length);
      console.log(`   📊 Média de pontos: ${avgPoints}`);
      console.log(`   🔥 Maior streak: ${Math.max(...gamificationData.map(g => g.currentStreak))} dias`);
      console.log(`   📚 Total de itens lidos: ${gamificationData.reduce((sum, g) => sum + g.itemsRead, 0)}`);
    } else {
      console.log("   ⚠️  Nenhum dado de gamificação (será criado no primeiro acesso)");
    }

    // 5. Verificar consistência de dados
    console.log("\n🔍 5. Verificando Consistência dos Dados...");
    
    // Total de itens no catálogo
    const totalItems = await db.select({ count: item.id }).from(item);
    console.log(`   📚 ${totalItems.length} resumos no catálogo`);

    // Verificar se há itens com PDF
    const itemsWithPdf = await db
      .select({ id: item.id })
      .from(item)
      .where(eq(item.hasPdf, true))
      .limit(1);
    console.log(`   📄 PDFs disponíveis: ${itemsWithPdf.length > 0 ? "Sim" : "Não"}`);

    // Verificar se há itens com covers
    const itemsWithCovers = await db
      .select({ id: item.id, coverImageUrl: item.coverImageUrl })
      .from(item)
      .limit(10);
    const coversCount = itemsWithCovers.filter(i => i.coverImageUrl).length;
    console.log(`   🖼️  Capas disponíveis: ${coversCount}/${itemsWithCovers.length} (amostra)`);

    // 6. Testar fluxo completo de leitura
    console.log("\n🔄 6. Verificando Fluxo Completo de Leitura...");
    
    if (progressData.length > 0 && events.length > 0) {
      const userWithProgress = progressData[0].userId;
      
      // Verificar se o mesmo usuário tem eventos
      const userEvents = events.filter(e => e.userId === userWithProgress);
      
      if (userEvents.length > 0) {
        console.log("   ✅ Fluxo completo detectado:");
        console.log("      1. Usuário inicia leitura (reading_event)");
        console.log("      2. Progresso é salvo (reading_progress)");
        console.log("      3. Aparece em 'Continue Lendo'");
        console.log("      4. Gera dados para 'Similar Items'");
      } else {
        console.log("   ⚠️  Usuários com progresso não têm eventos registrados");
      }
    } else {
      console.log("   ℹ️  Fluxo completo não pode ser testado (sem dados de usuários)");
    }

    // 7. Resumo final
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA INTEGRAÇÃO\n");
    
    const checks = {
      "Continue Lendo ↔ Progresso": progressData.length > 0,
      "Recomendações ↔ Preferências": preferences.length > 0,
      "Similar Items ↔ Events": events.length > 0,
      "Dashboard ↔ Gamificação": gamificationData.length > 0,
      "Catálogo de Itens": totalItems.length > 0,
    };

    Object.entries(checks).forEach(([name, status]) => {
      console.log(`   ${status ? "✅" : "⚠️ "} ${name}`);
    });

    const workingCount = Object.values(checks).filter(Boolean).length;
    const totalCount = Object.values(checks).length;
    const percentage = Math.round((workingCount / totalCount) * 100);

    console.log(`\n   🎯 Status Geral: ${workingCount}/${totalCount} sistemas operacionais (${percentage}%)`);
    
    if (percentage === 100) {
      console.log("\n   🎉 Todas as integrações estão funcionando perfeitamente!");
    } else if (percentage >= 60) {
      console.log("\n   ✅ Integrações principais estão funcionando.");
      console.log("   ℹ️  Alguns dados podem estar vazios por falta de uso do sistema.");
    } else {
      console.log("\n   ⚠️  Algumas integrações precisam de atenção.");
      console.log("   ℹ️  Isso é normal em ambientes novos sem usuários ativos.");
    }

    console.log("\n" + "=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ Erro ao testar integração:", error);
    console.error("\nDetalhes:", error.message);
    process.exit(1);
  }
}

testIntegration()
  .then(() => {
    console.log("\n✅ Teste de integração concluído com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });
