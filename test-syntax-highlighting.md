# Teste de Syntax Highlighting

## JavaScript
```javascript
const greeting = "Hello, World!";
let count = 42;
var isActive = true;

function calculateSum(a, b) {
  // This is a comment
  if (a > 0 && b > 0) {
    return a + b;
  } else {
    console.log("Invalid input");
    return null;
  }
}

class User {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  
  async getData() {
    try {
      const response = await fetch('/api/user');
      return response.json();
    } catch (error) {
      console.error("Error:", error);
    }
  }
}
```

## Python
```python
def calculate_fibonacci(n):
    """Calculate fibonacci sequence"""
    if n <= 1:
        return n
    else:
        return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        print(f"Hello, my name is {self.name}")
        return True

# Main execution
if __name__ == "__main__":
    numbers = [1, 2, 3, 4, 5]
    result = sum(numbers)
    print(f"Sum: {result}")
```

## Java
```java
public class Calculator {
    private static final double PI = 3.14159;
    
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        int result = calc.add(10, 20);
        System.out.println("Result: " + result);
    }
    
    public int add(int a, int b) {
        // Simple addition method
        if (a > 0 && b > 0) {
            return a + b;
        }
        return 0;
    }
    
    public double calculateArea(double radius) {
        return PI * radius * radius;
    }
}
```

## HTML
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha Página</title>
</head>
<body>
    <!-- Comentário HTML -->
    <div class="container">
        <h1 id="title">Bem-vindo!</h1>
        <p class="description">Esta é uma página de exemplo.</p>
        <button onclick="alert('Clicou!')">Clique aqui</button>
    </div>
</body>
</html>
```

## CSS
```css
/* Estilos principais */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f5f5f5;
}

#title {
    font-size: 2.5rem;
    color: #333;
    text-align: center;
    margin-bottom: 1rem;
}

.description {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #666;
}

button:hover {
    background-color: #007bff;
    transform: translateY(-2px);
    transition: all 0.3s ease;
}
```

## SQL
```sql
-- Consulta de exemplo
SELECT u.name, u.email, p.title, p.created_at
FROM users u
INNER JOIN posts p ON u.id = p.user_id
WHERE u.active = true
  AND p.published = true
  AND p.created_at >= '2024-01-01'
ORDER BY p.created_at DESC
LIMIT 10;

-- Inserção de dados
INSERT INTO users (name, email, created_at)
VALUES ('João Silva', 'joao@email.com', NOW());

-- Atualização
UPDATE posts 
SET title = 'Novo Título', updated_at = NOW()
WHERE id = 1 AND user_id = 123;
```

## JSON
```json
{
  "name": "TXOPITO IA",
  "version": "2.1.0",
  "description": "Assistente educacional inteligente",
  "features": [
    "Múltiplos domínios",
    "Memória contextual",
    "Geração de imagens",
    "Syntax highlighting"
  ],
  "config": {
    "maxTokens": 4096,
    "temperature": 0.7,
    "topP": 0.9,
    "enabled": true
  },
  "domains": {
    "programming": {
      "active": true,
      "languages": ["javascript", "python", "java"]
    },
    "consulting": {
      "active": true,
      "frameworks": ["SWOT", "Canvas", "OKR"]
    }
  }
}
```

## Bash/Shell
```bash
#!/bin/bash

# Script de deploy
PROJECT_NAME="txopito-ia"
BUILD_DIR="dist"
SERVER_PATH="/var/www/html"

echo "Iniciando deploy do $PROJECT_NAME..."

# Função para verificar erros
check_error() {
    if [ $? -ne 0 ]; then
        echo "Erro: $1"
        exit 1
    fi
}

# Build do projeto
npm run build
check_error "Falha no build"

# Backup do diretório atual
if [ -d "$SERVER_PATH" ]; then
    cp -r "$SERVER_PATH" "${SERVER_PATH}_backup_$(date +%Y%m%d_%H%M%S)"
    echo "Backup criado com sucesso"
fi

# Deploy dos arquivos
rsync -av --delete "$BUILD_DIR/" "$SERVER_PATH/"
check_error "Falha no deploy"

# Reiniciar serviços
systemctl restart nginx
systemctl restart pm2

echo "Deploy concluído com sucesso!"
```