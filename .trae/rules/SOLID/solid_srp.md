# SRP - Single Responsibility Principle

## Definição
Uma classe deve ter apenas uma razão para mudar. Cada classe deve ter uma única responsabilidade bem definida.

## Importância
- **Manutenibilidade**: Código mais fácil de entender e modificar
- **Testabilidade**: Testes unitários mais simples e focados
- **Flexibilidade**: Mudanças não afetam partes não relacionadas

## Exemplo
```php
// Viola SRP
class User {
    public function createUser() { /* ... */ }
    public function sendEmail() { /* ... */ }
    public function logActivity() { /* ... */ }
}

// Aplica SRP
class User {
    public function createUser() { /* ... */ }
}

class EmailService {
    public function sendEmail() { /* ... */ }
}
```

## Aplicação
- Identifique responsabilidades distintas
- Separe em classes diferentes
- Use composição quando necessário