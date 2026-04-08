# Domain-Driven Design - Estrutura de Projeto

## Definição
Organização baseada em domínios de negócio, onde cada módulo representa um contexto específico do negócio.

## Estrutura por Contextos Delimitados
```
src/
├── modules/
│   ├── user-management/
│   ├── order-processing/
│   ├── inventory/
│   └── billing/
├── shared/
│   ├── kernel/       # Conceitos compartilhados
│   └── contracts/    # Interfaces comuns
└── infrastructure/   # Implementações técnicas
```

## Estrutura por Módulo
```
user-management/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/  # Interfaces
│   └── events/
├── application/
│   ├── commands/
│   ├── queries/
│   └── services/
└── infrastructure/
    ├── persistence/
    └── integrations/
```

## Conceitos DDD
- **Entidades**: Objetos com identidade única
- **Value Objects**: Objetos sem identidade
- **Agregados**: Grupos de entidades relacionadas
- **Eventos de Domínio**: Notificações de mudanças
- **Serviços de Domínio**: Lógica complexa do negócio
- **Repositórios**: Acesso a dados do domínio