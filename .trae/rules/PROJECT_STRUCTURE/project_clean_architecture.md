# Clean Architecture - Estrutura de Projeto

## Definição
Arquitetura em camadas que separa o projeto em 4 camadas principais: Domain, Application, Infrastructure e Presentation.

## Estrutura Base
```
src/
├── Domain/           # Núcleo da aplicação - zero dependências
├── Application/      # Casos de uso - referencia apenas Domain
├── Infrastructure/   # Serviços externos - implementa interfaces
├── Presentation/     # Entrada da aplicação - controllers/API
└── SharedKernel/     # Funcionalidades compartilhadas (opcional)
```

## Domain Layer
- Entidades, Value Objects, Agregados
- Eventos de domínio, Exceções
- Interfaces de repositórios
- **Regra**: Não pode referenciar outras camadas

## Application Layer
- Comandos e Queries (CQRS)
- Handlers, Serviços de aplicação
- DTOs, Validações
- **Regra**: Referencia apenas Domain

## Infrastructure Layer
- Implementações de repositórios
- Integrações externas (DB, APIs, filas)
- Configurações de persistência
- **Regra**: Implementa interfaces do Domain

## Presentation Layer
- Controllers, endpoints API
- ViewModels, configurações
- Middleware, tratamento de erros
- **Regra**: Ponto de entrada do sistema