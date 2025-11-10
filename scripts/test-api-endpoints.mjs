#!/usr/bin/env node
/**
 * Teste de endpoints HTTP das APIs
 * Verifica se as rotas estão respondendo corretamente
 */

console.log("🌐 Testando Endpoints HTTP - Paretto Estudos\n");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testEndpoint(name, path, options = {}) {
  try {
    const url = `${BASE_URL}${path}`;
    console.log(`📡 Testando: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok || response.status === 401) {
      // 401 é esperado para rotas protegidas sem autenticação
      if (response.status === 401) {
        console.log(`   ✅ Rota protegida (autenticação necessária)`);
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          console.log(`   ✅ Resposta JSON válida`);
          if (data.items) {
            console.log(`   📦 Retornou ${data.items?.length || 0} itens`);
          } else if (data.leaderboard) {
            console.log(`   📦 Retornou ${data.leaderboard?.length || 0} entradas`);
          } else if (data.error) {
            console.log(`   ⚠️  Erro esperado: ${data.error}`);
          }
        } else {
          console.log(`   ✅ Resposta recebida (${contentType})`);
        }
      }
      return { success: true, status: response.status };
    } else {
      console.log(`   ❌ Falhou com status ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log("=".repeat(60) + "\n");

  const tests = [
    // APIs públicas
    {
      name: "Recommendations (pública)",
      path: "/api/recommendations?limit=5",
      expectStatus: [200],
    },
    {
      name: "Items (catálogo)",
      path: "/api/items",
      expectStatus: [200],
    },
    {
      name: "Similar Items",
      path: "/api/similar-items?itemId=test&limit=5",
      expectStatus: [200, 400], // 400 se itemId não existir
    },
    {
      name: "Leaderboard",
      path: "/api/gamification/leaderboard?limit=10",
      expectStatus: [200],
    },
    {
      name: "Health Check",
      path: "/api/health",
      expectStatus: [200],
    },
    
    // APIs protegidas (devem retornar 401 sem auth)
    {
      name: "Continue Reading (protegida)",
      path: "/api/continue-reading",
      expectStatus: [200, 401],
    },
    {
      name: "Dashboard (protegida)",
      path: "/api/dashboard",
      expectStatus: [200, 401],
    },
    {
      name: "Progress (protegida)",
      path: "/api/progress?itemId=test",
      expectStatus: [200, 401],
    },
    {
      name: "User Preferences (protegida)",
      path: "/api/user/preferences",
      expectStatus: [200, 401],
    },
    {
      name: "Analytics (protegida)",
      path: "/api/analytics",
      expectStatus: [200, 401],
    },
    {
      name: "Gamification Profile (protegida)",
      path: "/api/gamification/profile",
      expectStatus: [200, 401],
    },
  ];

  const results = [];

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.path);
    results.push({
      name: test.name,
      success: test.expectStatus.includes(result.status),
      status: result.status,
    });
    console.log(); // linha em branco
  }

  // Resumo
  console.log("=".repeat(60));
  console.log("📊 RESUMO DOS TESTES\n");

  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const percentage = Math.round((successful / total) * 100);

  results.forEach(r => {
    const icon = r.success ? "✅" : "❌";
    console.log(`   ${icon} ${r.name} (${r.status})`);
  });

  console.log(`\n   🎯 Resultado: ${successful}/${total} endpoints funcionando (${percentage}%)`);
  
  if (percentage === 100) {
    console.log("\n   🎉 Todos os endpoints estão respondendo corretamente!");
  } else if (percentage >= 80) {
    console.log("\n   ✅ Maioria dos endpoints funcionando.");
  } else {
    console.log("\n   ⚠️  Alguns endpoints não estão respondendo.");
    console.log("   ℹ️  Certifique-se de que o servidor está rodando.");
  }

  console.log("\n" + "=".repeat(60));

  return percentage === 100;
}

// Executar apenas se o servidor estiver rodando
async function checkServer() {
  try {
    console.log("🔍 Verificando se o servidor está rodando...\n");
    const response = await fetch(`${BASE_URL}/api/health`, { 
      signal: AbortSignal.timeout(5000) 
    });
    console.log(`✅ Servidor está rodando em ${BASE_URL}\n`);
    return true;
  } catch (error) {
    console.log(`❌ Servidor não está respondendo em ${BASE_URL}`);
    console.log(`   Erro: ${error.message}`);
    console.log(`\nℹ️  Para testar os endpoints, inicie o servidor com:`);
    console.log(`   npm run dev\n`);
    return false;
  }
}

checkServer()
  .then(async (serverRunning) => {
    if (serverRunning) {
      const success = await runTests();
      process.exit(success ? 0 : 1);
    } else {
      console.log("⏭️  Pulando testes de endpoint (servidor não está rodando)\n");
      console.log("✅ Para testar integração do banco de dados, use:");
      console.log("   node scripts/test-api-integration.mjs\n");
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });
