# OCP - Open/Closed Principle

## Definição
Software deve estar aberto para extensão, mas fechado para modificação.

## Importância
- **Estabilidade**: Reduz risco de bugs ao adicionar funcionalidades
- **Flexibilidade**: Adapte-se a novos requisitos facilmente

## Exemplo
```php
// Viola OCP
class AreaCalculator {
    public function calculate($shape) {
        if ($shape instanceof Circle) {
            return pi() * pow($shape->radius, 2);
        } elseif ($shape instanceof Square) {
            return pow($shape->length, 2);
        }
    }
}

// Aplica OCP
interface Shape {
    public function area();
}

class Circle implements Shape {
    public function area() { return pi() * pow($this->radius, 2); }
}

class AreaCalculator {
    public function calculate(Shape $shape) {
        return $shape->area();
    }
}
```

## Aplicação
- Use interfaces e classes abstratas
- Aplique polimorfismo
- Evite switch/case grandes