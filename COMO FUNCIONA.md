# NR Caçambas — Chatbot de Atendimento

Esse projeto é um chatbot de atendimento para a NR Caçambas, feito para automatizar pedidos de caçamba pelo site. O cliente conversa com o bot, escolhe o tamanho, informa o endereço e confirma o pedido — tudo salva automaticamente numa planilha do Google Sheets.

A inteligência artificial (Groq) responde perguntas livres que fogem do fluxo principal, como dúvidas sobre preços, prazos ou qualquer outra coisa.

---

## O que o sistema faz

- Recebe pedidos de caçamba pelo chat
- Valida as informações do cliente (nome, telefone, endereço)
- Salva tudo automaticamente no Google Sheets
- Responde dúvidas com IA (Groq — gratuito)
- Detecta se está dentro do horário de atendimento
- Tem botão direto para o WhatsApp da empresa

---

## O que você vai precisar

- VS Code com a extensão **Live Server**
- Uma conta Google
- Uma chave gratuita da API do Groq

---

## Como rodar

### 1. Pegar a chave do Groq (gratuita)

1. Acesse [console.groq.com](https://console.groq.com)
2. Crie uma conta (pode usar o Google)
3. Vá em **"API Keys"** → **"Create API Key"**
4. Copie a chave gerada (começa com `gsk_...`)
5. Abra o `env.js` e cole sua chave:

```js
var GROQ_API_KEY = "gsk_sua_chave_aqui";
```

> ⚠️ O `env.js` nunca sobe pro GitHub — já está no `.gitignore`.

---

### 2. Criar a planilha

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha nova
2. Na primeira linha, coloque esses cabeçalhos:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Nº Pedido | Nome | Telefone | Bairro | Endereço | Tamanho | Data | Horário | Status |

---

### 3. Configurar o Apps Script

1. Dentro da planilha, clique em **Extensões → Apps Script**
2. Apague o conteúdo padrão e cole o conteúdo do arquivo `Codigo.gs`
3. Troque o ID da planilha no código pelo ID da sua:

```js
SpreadsheetApp.openById("ID_DA_SUA_PLANILHA")
```

> O ID está na URL da planilha, entre `/d/` e `/edit`.

4. Salve com **Ctrl+S**

---

### 4. Publicar o Apps Script

1. Clique em **Implantar → Nova implantação**
2. Tipo: **Aplicativo da Web**
3. Configure assim:
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
4. Clique em **Implantar** e copie a URL gerada

5. Cole essa URL no `script.js`:

```js
var sheetsUrl = "URL_COPIADA_AQUI";
```

> ⚠️ Se alterar o código do Apps Script depois, sempre crie uma **nova versão** na implantação.

---

### 5. Abrir o chatbot

1. Abra a pasta no VS Code
2. Clique com botão direito no `index.html`
3. Selecione **"Open with Live Server"**

---

## Arquivos do projeto

```
nr_cacambas_final/
├── index.html        → página do chatbot
├── style.css         → visual
├── script.js         → toda a lógica do bot
├── env.js            → sua chave Groq (não sobe pro GitHub)
├── env.example.js    → modelo da chave
├── Codigo.gs         → código do Google Apps Script
└── .gitignore        → proteção da chave
```

---

## Problemas comuns

**O chatbot não abre direito**
→ Abre pelo Live Server, não clicando direto no arquivo.

**A IA não responde**
→ Confere se o `env.js` existe e se a chave está correta (começa com `gsk_`).

**O pedido não aparece na planilha**
→ Confirma que o ID da planilha no `Codigo.gs` está correto.
→ Verifica se "Quem tem acesso" está como **Qualquer pessoa**.
→ Sempre que alterar o Apps Script, cria uma nova versão na implantação.
