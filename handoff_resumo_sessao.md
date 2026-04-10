# Handoff - Resumo da Sessão (Refatoração e Evolução do MVP)

Este documento resume as melhorias arquiteturais e de produto implementadas na última sessão, preparando o terreno para o próximo agente ou desenvolvedor que for atuar no projeto.

---

## 1. Arquitetura e Gerenciamento de Estado
A aplicação sofria com "God Components" (ex: `App.tsx`) e excesso de Prop Drilling via Context API.
- **Zustand Implementado:** O estado global da aplicação foi migrado de um Contexto massivo (`FactoryContext.tsx` foi removido) para o Zustand (`src/store/useAppStore.ts`). 
- **App.tsx Limpo:** O arquivo principal agora possui apenas a estrutura de roteamento (`react-router-dom`), sem regras de negócio ou estados.
- **Hook de Persistência (useAutoSave):** A lógica de debounce e salvamento automático (`PUT /api/state`) foi abstraída em um hook (`src/hooks/useAutoSave.ts`). Adicionamos `AbortController` para cancelar requisições concorrentes caso o usuário digite rápido demais.

## 2. Serverless e MongoDB (Resiliência)
- **Centralização da API:** Arquivos duplicados no servidor local (`src/server/`) foram apagados. Agora, tanto em desenvolvimento quanto em produção, as Serverless Functions (`api/_lib/mongo.ts`, `stateStore.ts`) são a única fonte da verdade.
- **Fallback In-Memory:** Foi implementada uma proteção robusta. Se o banco de dados (MongoDB) cair ou a string de conexão (`MONGODB_URI`) não for configurada, a API não lança mais Erro 500. Ela emite um *warning* no console e passa a funcionar em um "Modo Memória Volátil" (In-Memory Fallback).
- **Proteção de Pool (Serverless):** No modo de desenvolvimento, a conexão MongoDB agora é guardada no objeto global (`globalThis._mongoClientPromise`) para evitar *Pool Exhaustion* durante Hot Reloads (HMR).

## 3. Integração com a Omie (React Query)
- **TanStack Query Adicionado:** Instalamos e configuramos o `@tanstack/react-query` no `main.tsx`.
- **Fim dos useEffects Manuais:** As páginas pararam de fazer chamadas de rede manuais via `useState`. Toda a comunicação com o Omie agora ocorre por Hooks tipados em `src/api/omie/queries.ts` (ex: `useOmieProducts`, `useOmieFamilies`).
- **Mutations:** Ações de importar produtos ou criar planejamentos automáticos agora usam `useMutation`. Elas não travam mais a UI (pois implementamos promises de delay/event loop) e exibem loadings precisos nos botões.
- **Cache e Deduplicação:** O proxy interno que chama a Omie (`api/_lib/omieCache.ts`) também ganhou suporte ao Fallback In-Memory para evitar bloqueios de Rate Limit da API Omie (Erro REDUNDANT) caso o Mongo falhe.

## 4. Evolução do Motor de Planejamento (Planner)
- **Modo MVP (Sem Receita):** Produtos que são importados da Omie sem ingredientes (sem receita) não geram mais *loops infinitos*. O Planner agora os agenda apenas consumindo "Capacidade", ignorando validações de estoque, mas gera um alerta (Warning) deduplicado ("Faltam dados de receita...").
- **Algoritmo Guloso Aprimorado (Greedy):** A ordenação do motor (`src/lib/planner.ts`) recebeu 3 regras de desempate:
  1. **Prioridade (Score):** (1 a 5, novo campo adicionado na entidade Order).
  2. **Data Limite (Target Date):** Quem vence primeiro, entra primeiro.
  3. **Menor Trabalho Primeiro (SJF):** Em caso de empate absoluto, o pedido com menor quantidade ganha para desafogar a fila.
- **Testes Unitários:** O Vitest foi instalado e os cenários matemáticos acima foram garantidos em `src/lib/planner.test.ts`.

## 5. Nova Entidade: Setores de Produção
- **Domínio Criado:** Criada a interface `Sector` (id, name, order, capacity: { daily }).
- **UI Drag & Drop:** Foi criada a página `src/pages/Sectors.tsx`, com suporte a reordenação arrastável usando a biblioteca `framer-motion` (`Reorder.Group`).
- **Hydration Segura:** Adicionada uma proteção no Zustand (`hydrateState`) que injeta a capacidade padrão (100) e ignora arrays corrompidos (`null`) salvos no LocalStorage/MongoDB legado, quebrando a tela com "Cannot read properties of undefined".

## 6. Refatoração Extrema de UI (Clean Architecture Frontend)
- **Página de Planejamento (PlanningView):** Um arquivo de quase 500 linhas foi quebrado em pequenas peças isoladas seguindo DDD:
  - **Componentes Visuais (`src/features/planning/components/`)**: `PlanningHeader`, `PlanningWarnings`, `PlanningFilters`, `PlanningSchedule`, `OrderModal`, `AutoPlanModal`.
  - **Hooks de Orquestração (`src/features/planning/hooks/`)**: `usePlanningEngine`, `useOrderModal`, `useAutoPlanModal`.
  - O `Planning.tsx` final tem cerca de 110 linhas e atua **apenas** como orquestrador de props.
- **Foco no MVP:** Rotas secundárias ("Matéria-Prima" e "Pedidos") foram comentadas da Sidebar e do roteador para focar a visão do cliente apenas no necessário para o fluxo principal de produção.

---
**Status do Linter:** `npm run lint` passando em 100% dos arquivos modificados. Nenhuma tipagem frouxa introduzida.
**Próximos Passos Sugeridos:** Continuar iterando na aba de Setores (talvez ligando o Planner a capacidades por setor ao invés da Capacidade Global que está no Layout) e revisar se a criação manual de ingredientes (`RawMaterials`) será necessária para o fluxo de "Receitas".