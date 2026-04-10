Aqui está o plano de segurança e a estratégia de refatoração detalhada, estruturada para garantir que a transição para uma arquitetura limpa (Clean Architecture / SOLID) ocorra sem regressões ou quebra das funcionalidades atuais.

### 1. Fluxos Críticos do App (Telas e Ações Principais)

Estes são os fluxos de valor do negócio que não podem quebrar durante a refatoração:

- Inicialização e Persistência: Carregamento inicial do estado da fábrica (produtos, materiais, pedidos, config) via GET /api/state e o mecanismo de auto-save com debounce via PUT /api/state .
- Navegação (Roteamento Atual): A troca de contexto entre as visualizações (Dashboard, Produtos, Materiais, Pedidos, Planejamento) que atualmente é feita via estado local ( activeTab ).
- Integração Omie: O fluxo de busca, paginação e importação de produtos/famílias através do proxy da Vercel ( /api/omie/... ), garantindo que o cache e a deduplicação de códigos funcionem.
- Gestão de Operações: Adicionar/remover pedidos de produção e atualizar o estoque manual de matérias-primas.
- Motor de Planejamento (Planner): O recálculo automático ( useMemo ) da grade de produção sempre que os pedidos, capacidade ou insumos são alterados.

### 2. Pontos de Acoplamento e Dores Atuais

- App.tsx (God Component):
  - Mistura gerenciamento de estado global, lógica de chamadas HTTP (Mongo e Omie), controle manual de roteamento, e renderização de múltiplas telas. Fere o SRP (Single Responsibility Principle).
- Persistência Acoplada à UI:
  - A lógica complexa de AbortController , setTimeout (debounce) e tratativa de erros do MongoDB vive no ciclo de vida (useEffect) do componente visual raiz.
- Estado de Fetch Manual (OmieService vs UI):
  - O frontend consome os serviços da Omie usando múltiplos useState (loading, error, data) e useEffect , o que causa renderizações desnecessárias e acoplamento de ciclo de vida.
- Backend Duplicado:
  - O projeto possui o servidor local Express ( src/server/mongo.ts ) e funções Serverless Vercel ( api/\_lib/mongo.ts ) fazendo exatamente a mesma coisa.

### 3. Estratégia de Refatoração Incremental (Ordem Sugerida)

Faremos a migração em "checkpoints" isolados, permitindo testes entre cada etapa.

- Checkpoint 1: Limpeza do Backend e Padronização do Ambiente
  - Excluir a pasta src/server (Express) e o script de inicialização do node.
  - Padronizar o ambiente de desenvolvimento usando exclusivamente o comando vercel dev .
  - Criar o esqueleto da nova arquitetura de pastas ( src/features , src/store , src/hooks , src/pages ).
- Checkpoint 2: Extração de Estado Global e Persistência (Zustand)
  - Instalar Zustand.
  - Criar a store global ( useFactoryStore ) contendo products , materials , orders e config .
  - Extrair a lógica do MongoDB para um custom hook useAutoSave que escuta as mudanças da store em background, removendo isso do App.tsx .
- Checkpoint 3: Roteamento e Layout Base
  - Instalar react-router-dom .
  - Criar o componente Layout.tsx contendo a Sidebar e o Header .
  - Substituir a lógica de activeTab por um BrowserRouter e rotas base no App.tsx .
- Checkpoint 4: Separação das Features (Fim do God Component)
  - Mover o conteúdo de cada "aba" do App.tsx para componentes isolados (ex: src/features/dashboard/Dashboard.tsx , src/features/planning/Planning.tsx ).
  - Conectar esses componentes isolados à store do Zustand em vez de receberem props gigantescas do pai.
- Checkpoint 5: Refatoração de Requisições com React Query
  - Instalar @tanstack/react-query .
  - Refatorar os modais de integração com a Omie para usar useQuery , eliminando a necessidade de gerenciar manualmente loading e paginação.
- Checkpoint 6: Evolução Lógica do Planner
  - Atualizar o arquivo planner.ts para suportar prioridades de pedidos.
  - Implementar o bloqueio/alerta visual no Planner caso um pedido contenha um produto da Omie recém-importado sem receita (insumos) vinculada.

### 4. Definição de Pronto (DoD) e Checklist de Validação Manual

Definição de Pronto (DoD):

- O código passa sem erros de TypeScript e sem avisos no Linter (ESLint).
- A responsabilidade está isolada: UI não faz fetch direto, serviços não manipulam estado visual.
- Nenhuma funcionalidade anterior foi perdida (Zero Regressions).
- O console do navegador está limpo (sem memory leaks , sem erros de keys no React, sem requisições HTTP duplicadas em vermelho).
  Checklist de Validação Manual após cada Checkpoint:
- Persistência: Alterar o estoque de um insumo, aguardar 1 segundo, dar refresh na página (F5) e confirmar se o valor foi mantido pelo MongoDB.
- Navegação (Deep Link): Acessar diretamente a URL /planejamento pelo navegador e verificar se a página carrega corretamente com a Sidebar no estado certo.
- Omie Proxy: Abrir a tela de integração Omie, buscar por "Chocolate" e confirmar se o loading state funciona e os itens renderizam sem duplicatas.
- Planner Resiliente: Adicionar um pedido sem receita configurada e checar se a UI exibe claramente o erro "Faltam dados de receita", impedindo que o algoritmo crashe.
- Ambiente Local: Rodar o app e garantir que todas as chamadas fetch('/api/...') sejam roteadas corretamente para as serverless functions da Vercel.

