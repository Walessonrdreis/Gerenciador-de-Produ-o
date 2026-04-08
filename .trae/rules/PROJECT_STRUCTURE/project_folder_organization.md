# Organização de Pastas - Estrutura de Projeto

## Estrutura por Funcionalidade
```
src/
├── modules/          # Módulos por domínio
│   ├── users/
│   ├── orders/
│   └── products/
├── shared/           # Código compartilhado
└── core/             # Núcleo da aplicação
```

## Organização por Tipo
```
src/
├── components/       # Componentes reutilizáveis
├── services/         # Lógica de negócio
├── repositories/       # Acesso a dados
├── models/           # Entidades/DTOs
├── utils/            # Funções utilitárias
└── config/           # Configurações
```

## Estrutura Híbrida Recomendada
```
src/
├── features/         # Funcionalidades
│   ├── auth/
│   ├── dashboard/
│   └── profile/
├── shared/
│   ├── components/
│   ├── utils/
│   └── types/
├── assets/           # Recursos estáticos
└── styles/           # Estilos globais
```

## Princípios de Organização
- **Coesão**: Arquivos relacionados ficam juntos
- **Escalabilidade**: Fácil adicionar novos módulos
- **Manutenibilidade**: Fácil localizar e modificar
- **Reutilização**: Componentes compartilhados centralizados