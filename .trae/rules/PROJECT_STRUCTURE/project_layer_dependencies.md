# Dependências entre Camadas - Estrutura de Projeto

## Regra de Dependência
As dependências sempre apontam para dentro: Presentation → Application → Domain

## Fluxo de Dependências
```
Presentation Layer (API/Web)
    ↓ (depende de)
Application Layer (Use Cases/Services)
    ↓ (depende de)  
Domain Layer (Business Logic)
    ↑ (implementa)
Infrastructure Layer (External Services)
```

## Regras de Dependência
- **Domain**: Não pode referenciar nenhuma outra camada
- **Application**: Pode referenciar apenas Domain
- **Infrastructure**: Implementa interfaces do Domain
- **Presentation**: Pode referenciar Application e Domain

## Exemplo de Violação
```csharp
// ERRADO - Domain referenciando Infrastructure
public class Order 
{
    public void Save() 
    {
        // Não pode ter código de persistência aqui!
    }
}
```

## Exemplo Correto
```csharp
// Certo - Domain define interface
public interface IOrderRepository 
{
    Task<Order> GetByIdAsync(Guid id);
}

// Infrastructure implementa interface
public class OrderRepository : IOrderRepository 
{
    // Implementação da persistência
}
```

## Benefícios
- **Testabilidade**: Cada camada testável isoladamente
- **Flexibilidade**: Troque implementações sem afetar lógica
- **Manutenibilidade**: Mudanças isoladas por camada