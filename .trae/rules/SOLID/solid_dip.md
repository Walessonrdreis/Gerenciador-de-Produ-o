# DIP - Dependency Inversion Principle

## Definição
Dependa de abstrações, não de implementações concretas.

## Importância
- **Desacoplamento**: Reduz dependências entre módulos
- **Flexibilidade**: Troque implementações sem afetar clientes

## Exemplo
```php
// Viola DIP
class UserController {
    private $mysqlDatabase;
    
    public function __construct() {
        $this->mysqlDatabase = new MySQLDatabase();
    }
}

// Aplica DIP
interface DatabaseInterface {
    public function save($data);
}

class UserController {
    private $database;
    
    public function __construct(DatabaseInterface $database) {
        $this->database = $database;
    }
}

class MySQLDatabase implements DatabaseInterface {
    public function save($data) { /* ... */ }
}
```

## Aplicação
- Use injeção de dependência
- Programe para interfaces
- Evite dependências diretas