# ISP - Interface Segregation Principle

## Definição
Clientes não devem ser forçados a depender de interfaces que não utilizam.

## Exemplo
```php
// Viola ISP
interface Worker {
    public function work();
    public function eat();
    public function sleep();
}

class Robot implements Worker {
    public function work() { /* ... */ }
    public function eat() { /* Robot não come! */ }
    public function sleep() { /* Robot não dorme! */ }
}

// Aplica ISP
interface Workable {
    public function work();
}

interface Feedable {
    public function eat();
}

class Robot implements Workable {
    public function work() { /* ... */ }
}

class Human implements Workable, Feedable {
    public function work() { /* ... */ }
    public function eat() { /* ... */ }
}
```

## Aplicação
- Divida interfaces grandes em menores
- Agrupe métodos relacionados