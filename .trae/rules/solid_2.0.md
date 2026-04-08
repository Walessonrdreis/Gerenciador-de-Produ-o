# SOLID Principles - Regras de Design de Software (Versão 2.0)

## S - Single Responsibility Principle (SRP)
Uma classe deve ter apenas uma razão para mudar. Cada classe deve ter uma única responsabilidade bem definida. Isso torna o código mais fácil de manter e testar.

## O - Open/Closed Principle (OCP)
Software deve estar aberto para extensão, mas fechado para modificação. Use interfaces e abstrações para adicionar novos comportamentos sem alterar código existente, garantindo estabilidade.

## L - Liskov Substitution Principle (LSP)
Objetos de uma classe base devem ser substituíveis por objetos de suas classes derivadas sem quebrar a aplicação. Subclasses devem respeitar o contrato da classe pai, mantendo previsibilidade.

## I - Interface Segregation Principle (ISP)
Clientes não devem ser forçados a depender de interfaces que não utilizam. Prefira interfaces específicas e coesas ao invés de interfaces genéricas e grandes, reduzindo dependências desnecessárias.

## D - Dependency Inversion Principle (DIP)
Dependa de abstrações, não de implementações concretas. Módulos de alto nível não devem depender de módulos de baixo nível - ambos devem depender de abstrações, promovendo acoplamento flexível.

### Aplicação Prática Detalhada
- Use injeção de dependência para reduzir acoplamento entre componentes
- Prefira composição sobre herança quando possível para maior flexibilidade
- Teste suas abstrações para garantir que contratos sejam cumpridos
- Mantenha interfaces focadas e coesas, evitando "interfaces de gordura"
- Documente contratos e expectativas de cada classe para facilitar manutenção
- Aplique os princípios gradualmente em refactoring para evitar grandes mudanças
- Use padrões de design que apoiam estes princípios (Factory, Strategy, etc.)