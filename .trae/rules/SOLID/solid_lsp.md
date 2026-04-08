# LSP - Liskov Substitution Principle

## Definição
Objetos de uma classe base devem ser substituíveis por objetos de suas classes derivadas.

## Exemplo
```php
// Viola LSP
class Rectangle {
    public function setWidth($w) { $this->width = $w; }
    public function setHeight($h) { $this->height = $h; }
    public function area() { return $this->width * $this->height; }
}

class Square extends Rectangle {
    public function setWidth($w) { 
        $this->width = $w; 
        $this->height = $w; // Quebra expectativa!
    }
}

// Aplica LSP
interface Shape {
    public function area();
}

class Rectangle implements Shape {
    public function area() { return $this->width * $this->height; }
}

class Square implements Shape {
    public function area() { return pow($this->side, 2); }
}
```

## Aplicação
- Respeite contratos da classe pai
- Use composição quando herança quebrar LSP