#!/usr/bin/env node
/**
 * Verificação Simples de Comunicação entre APIs
 * Analisa o código fonte para verificar conexões
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log("🔍 Verificando Comunicação entre APIs - Paretto Estudos\n");
console.log("=".repeat(60) + "\n");

const srcPath = join(process.cwd(), 'src');

function checkFileExists(path) {
  return existsSync(join(srcPath, path));
}

function checkImportInFile(filePath, importName) {
  try {
    const fullPath = join(srcPath, filePath);
    if (!existsSync(fullPath)) return false;
    const content = readFileSync(fullPath, 'utf-8');
    return content.includes(importName);
  } catch {
    return false;
  }
}

function checkTableUsage(filePath, tableName) {
  try {
    const fullPath = join(srcPath, filePath);
    if (!existsSync(fullPath)) return false;
    const content = readFileSync(fullPath, 'utf-8');
    return content.includes(tableName);
  } catch {
    return false;
  }
}

const checks = [];

// 1. Continue Lendo ↔ Progresso de Leitura
console.log("📖 1. Continue Lendo ↔ Progresso de Leitura");
const continueReadingExists = checkFileExists('app/api/continue-reading/route.ts');
const usesReadingProgress = checkTableUsage('app/api/continue-reading/route.ts', 'readingProgress');
const progressApiExists = checkFileExists('app/api/progress/route.ts');

console.log(`   API Continue Reading: ${continueReadingExists ? '✅' : '❌'}`);
console.log(`   Usa reading_progress: ${usesReadingProgress ? '✅' : '❌'}`);
console.log(`   API Progress: ${progressApiExists ? '✅' : '❌'}`);
checks.push({ name: 'Continue Lendo ↔ Progresso', ok: continueReadingExists && usesReadingProgress && progressApiExists });

// 2. Recomendações ↔ Preferências
console.log("\n🎯 2. Recomendações ↔ Preferências");
const recommendationsExists = checkFileExists('app/api/recommendations/route.ts');
const usesUserPreference = checkTableUsage('app/api/recommendations/route.ts', 'userPreference');
const preferencesApiExists = checkFileExists('app/api/user/preferences/route.ts');

console.log(`   API Recommendations: ${recommendationsExists ? '✅' : '❌'}`);
console.log(`   Usa user_preference: ${usesUserPreference ? '✅' : '❌'}`);
console.log(`   API Preferences: ${preferencesApiExists ? '✅' : '❌'}`);
checks.push({ name: 'Recomendações ↔ Preferências', ok: recommendationsExists && usesUserPreference && preferencesApiExists });

// 3. Similar Items ↔ Reading Events
console.log("\n✨ 3. Similar Items ↔ Reading Events");
const similarItemsExists = checkFileExists('app/api/similar-items/route.ts');
const usesReadingEvent = checkTableUsage('app/api/similar-items/route.ts', 'readingEvent');

console.log(`   API Similar Items: ${similarItemsExists ? '✅' : '❌'}`);
console.log(`   Usa reading_event: ${usesReadingEvent ? '✅' : '❌'}`);
checks.push({ name: 'Similar Items ↔ Events', ok: similarItemsExists && usesReadingEvent });

// 4. Dashboard ↔ Gamificação
console.log("\n🏆 4. Dashboard ↔ Gamificação");
const dashboardExists = checkFileExists('app/api/dashboard/route.ts');
const usesUserGamification = checkTableUsage('app/api/dashboard/route.ts', 'userGamification');
const gamificationProfileExists = checkFileExists('app/api/gamification/profile/route.ts');

console.log(`   API Dashboard: ${dashboardExists ? '✅' : '❌'}`);
console.log(`   Usa user_gamification: ${usesUserGamification ? '✅' : '❌'}`);
console.log(`   API Gamification Profile: ${gamificationProfileExists ? '✅' : '❌'}`);
checks.push({ name: 'Dashboard ↔ Gamificação', ok: dashboardExists && usesUserGamification && gamificationProfileExists });

// 5. Analytics ↔ Reading Data
console.log("\n📊 5. Analytics ↔ Reading Data");
const analyticsExists = checkFileExists('app/api/analytics/route.ts');
const analyticsUsesProgress = checkTableUsage('app/api/analytics/route.ts', 'readingProgress');
const analyticsUsesEvent = checkTableUsage('app/api/analytics/route.ts', 'readingEvent');

console.log(`   API Analytics: ${analyticsExists ? '✅' : '❌'}`);
console.log(`   Usa reading_progress: ${analyticsUsesProgress ? '✅' : '❌'}`);
console.log(`   Usa reading_event: ${analyticsUsesEvent ? '✅' : '❌'}`);
checks.push({ name: 'Analytics ↔ Reading Data', ok: analyticsExists && (analyticsUsesProgress || analyticsUsesEvent) });

// 6. Componentes Frontend
console.log("\n🖥️  6. Componentes Frontend");
const continueReadingComponent = checkFileExists('components/ContinueReading.tsx');
const similarItemsComponent = checkFileExists('components/SimilarItems.tsx');

console.log(`   Componente ContinueReading: ${continueReadingComponent ? '✅' : '❌'}`);
console.log(`   Componente SimilarItems: ${similarItemsComponent ? '✅' : '❌'}`);
checks.push({ name: 'Componentes Frontend', ok: continueReadingComponent && similarItemsComponent });

// 7. Verificar sistemas removidos não estão presentes
console.log("\n🗑️  7. Verificando Sistemas Removidos");
const noQuizApi = !checkFileExists('app/api/quiz');
const noChecklistApi = !checkFileExists('app/api/checklist');
const noNotesApi = !checkFileExists('app/api/notes');
const noFloatingTools = !checkFileExists('components/study/floating-study-tools.tsx');

console.log(`   Quiz API removida: ${noQuizApi ? '✅' : '❌'}`);
console.log(`   Checklist API removida: ${noChecklistApi ? '✅' : '❌'}`);
console.log(`   Notes API removida: ${noNotesApi ? '✅' : '❌'}`);
console.log(`   Floating Tools removido: ${noFloatingTools ? '✅' : '❌'}`);
checks.push({ name: 'Sistemas Removidos', ok: noQuizApi && noChecklistApi && noNotesApi && noFloatingTools });

// Resumo
console.log("\n" + "=".repeat(60));
console.log("📊 RESUMO DA VERIFICAÇÃO\n");

const passed = checks.filter(c => c.ok).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

checks.forEach(check => {
  console.log(`   ${check.ok ? '✅' : '❌'} ${check.name}`);
});

console.log(`\n   🎯 Resultado: ${passed}/${total} verificações passaram (${percentage}%)`);

if (percentage === 100) {
  console.log("\n   🎉 Todas as verificações passaram!");
  console.log("   ✅ APIs estão conectadas corretamente");
  console.log("   ✅ Sistemas removidos não estão presentes");
} else if (percentage >= 80) {
  console.log("\n   ✅ Maioria das verificações passaram");
  console.log("   ⚠️  Algumas integrações podem precisar de atenção");
} else {
  console.log("\n   ❌ Várias verificações falharam");
  console.log("   ℹ️  Verifique os arquivos mencionados acima");
}

console.log("\n" + "=".repeat(60));
console.log("\n📝 Para testar com dados reais:");
console.log("   1. Inicie o servidor: npm run dev");
console.log("   2. Execute: npm run test:endpoints");
console.log("   3. Faça login e use o sistema");
console.log("   4. Verifique o banco de dados com: npm run db:studio\n");

process.exit(percentage === 100 ? 0 : 1);
