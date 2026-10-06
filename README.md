# 💰 Minhas Finanças - Sistema de Gestão Financeira Pessoal

Sistema completo de controle financeiro pessoal e familiar, desenvolvido com **React 19**, **TypeScript**, **Tailwind CSS**, **Node.js/Express** e **Vite**.

Inclui importação inteligente de extratos e faturas em PDF, gestão de parcelas de cartão de crédito, subcategorias, cálculo automático de saldo acumulado entre meses, metas financeiras e gráficos analíticos.

---

## ✨ Principais Funcionalidades

1. **Aba Mensal Completa**:
   - Histórico detalhado de lançamentos com filtros por categoria, tipo e busca em tempo real.
   - **Saldo Acumulado Real**: se você termina um mês com saldo positivo ou negativo, o mês seguinte já inicia com esse saldo herdado.
   - Gráficos interativos por categoria em três formatos: **Pizza**, **Rosca** e **Barras**.
   - Calendário de vencimentos e controle de teto orçamentário por categoria.

2. **Cartão de Crédito & Parcelamentos**:
   - Controle de compras parceladas com identificação de parcela atual e total (ex: `1/3x`, `2/4x`).
   - Identificação e conversão de parcelas direto de extratos e faturas importadas.

3. **Categorias & Subcategorias Customizáveis**:
   - Cada categoria permite adicionar múltiplas subcategorias (ex: *Alimentação > Supermercado, Delivery, Restaurantes*).
   - Cores pastéis elegantes e customizáveis.
   - Definição de teto orçamentário mensal por categoria.

4. **Importador Inteligente de PDF e Texto**:
   - Leitura automática de extratos bancários e faturas de cartão (Nubank, Itaú, Bradesco, etc.).
   - Detecção automática de data, valor, categoria, tipo e parcelamento.

5. **Caixinhas & Metas Financeiras**:
   - Controle de objetivos (ex: Reserva de Emergência, Viagens, Carro novo) com barra de progresso e histórico de aportes e resgates.

6. **Visão Geral Anual**:
   - Balanço de 12 meses, comparação ano anterior vs atual e distribuição por meio de pagamento (Pix, Crédito, Débito, etc.).

7. **Perfis de Acesso & Segurança**:
   - Usuário **Master** (acesso completo, gerenciamento de usuários e backups).
   - Usuário **Preenchedor** (inserção de receitas e despesas diárias).
   - Exportação e Restauração de Backups em JSON com 1 clique.

---

## 🗄️ Como Funciona o Banco de Dados

### 1. Segurança para o GitHub (Privacidade dos seus dados)
O arquivo `.gitignore` já vem configurado para **proteger os seus dados financeiros reais**:
- O arquivo `data/db.json` com suas transações reais e senhas locais **NÃO é enviado para o GitHub**.
- O repositório inclui o modelo `data/db.example.json`. Quando o projeto é clonado ou iniciado pela primeira vez em outra máquina, ele gera automaticamente a estrutura inicial segura de banco de dados.

### 2. Banco em Nuvem com Firebase Firestore
O sistema possui integração direta com o **Google Cloud Firebase**:
- Projeto provisionado: `poetic-vial-v8gvj`.
- Banco Firestore dedicado para coleções de `categories`, `transactions`, `goals` e `users`.
- Através do botão **Nuvem Firebase** no topo da tela, você pode sincronizar todas as transações, subcategorias e metas locais para a nuvem do Google Firestore ou puxar os dados salvos em qualquer dispositivo.

### 3. Backups em Arquivo
Você pode exportar a qualquer momento um arquivo de backup completo com todas as suas transações pela interface clicando em **Exportar** no menu superior. Para restaurar em outra instalação, basta clicar em **Backup > Importar**.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente (opcional)
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

### 4. Iniciar em modo de desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador: **http://localhost:3000**

---

## 🐳 Como Rodar com Docker

Se preferir rodar com Docker e Docker Compose:

```bash
docker compose up -d
```
A aplicação estará disponível em **http://localhost:3000** com os dados salvos no volume local `./data`.

---

## 📤 Como Publicar no seu GitHub

Para enviar este projeto para a sua conta do GitHub:

1. **Crie um novo repositório vazio no GitHub**:
   - Acesse [github.com/new](https://github.com/new)
   - Dê um nome (ex: `planilha-financeira` ou `minhas-financas`)
   - Escolha se deseja deixá-lo **Público** ou **Privado**
   - **Não** marque a opção de inicializar com README (pois este projeto já possui um)

2. **No terminal do seu projeto, execute os comandos**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit - sistema financeiro completo"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

---

## 🛠️ Scripts Disponíveis

- `npm run dev` — Inicia o servidor Express e Vite com live reload.
- `npm run build` — Compila a interface frontend e empacota o backend para produção na pasta `dist`.
- `npm run start` — Inicia o servidor compilado em produção.
- `npm run lint` — Valida a tipagem TypeScript em todo o projeto.

---

## 🔒 Acesso Padrão Inicial
- **Usuário**: `fernanda.botelho`
- **Senha**: `1705`
*(A senha e os usuários podem ser alterados pelo menu de Usuários)*
