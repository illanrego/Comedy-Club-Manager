# CCAPP - Comedy Club Manager 🎤
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-orange)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)

## Visão Geral / Overview

CCAPP é um sistema completo de gerenciamento para casas de comédia stand-up, desenvolvido para facilitar a administração de shows, comediantes, estoque, bar e finanças. A aplicação foi construída utilizando Next.js 14 com App Router, oferecendo uma experiência moderna e responsiva para gerenciar todos os aspectos operacionais de um clube de comédia.

**CCAPP is a comprehensive management system for stand-up comedy clubs, designed to facilitate the administration of shows, comedians, inventory, bar operations, and finances. The application is built using Next.js 14 with App Router, offering a modern and responsive experience for managing all operational aspects of a comedy club.**

O projeto utiliza Server Actions ao invés de APIs REST quando possível, seguindo as melhores práticas do Next.js 14, e implementa uma arquitetura baseada em serviços chamados pelas actions.

**The project uses Server Actions instead of REST APIs when possible, following Next.js 14 best practices, and implements a service-based architecture called by actions.**

## Screenshots / Capturas de Tela

<div align="center">
  <img src="./images/screen1.png" alt="Dashboard" width="800"/>
  <p><em>Dashboard principal com estatísticas e gráficos / Main dashboard with statistics and charts</em></p>
</div>

<div align="center">
  <img src="./images/screen2.png" alt="Gestão de Comics" width="800"/>
  <p><em>Gestão de comediantes com sistema de classes / Comedian management with class system</em></p>
</div>

<div align="center">
  <img src="./images/screen3.png" alt="Sistema de Bar" width="800"/>
  <p><em>Sistema de bar com comandas e controle de vendas / Bar system with comandas and sales control</em></p>
</div>

## Funcionalidades Principais / Main Features 🚀

### 📊 Dashboard
- **Visão geral completa**: Estatísticas em tempo real de shows, comediantes, estoque e bar
- **Alertas inteligentes**: Notificações de estoque baixo e sessões de bar ativas
- **Gráficos de receita**: Visualização dos últimos shows com receita de ingressos e bar
- **Top performers**: Ranking dos comediantes por média de ingressos vendidos
- **Resumo financeiro**: Receita e lucro dos últimos 30 dias

**Complete overview**: Real-time statistics of shows, comedians, inventory, and bar operations | **Smart alerts**: Low stock notifications and active bar sessions | **Revenue charts**: Visualization of recent shows with ticket and bar revenue | **Top performers**: Ranking of comedians by average tickets sold | **Financial summary**: Revenue and profit from the last 30 days**

### 📅 Calendário e Agenda
- **Calendário visual**: Visualização mensal de todos os shows agendados
- **Gestão de shows**: Criação e edição de shows com múltiplos horários no mesmo dia
- **Agenda detalhada**: Controle completo de datas, horários e nomes dos shows
- **Histórico**: Acompanhamento de shows passados com métricas de qualidade

**Visual calendar**: Monthly view of all scheduled shows | **Show management**: Create and edit shows with multiple times on the same day | **Detailed schedule**: Complete control of dates, times, and show names | **History**: Tracking of past shows with quality metrics**

### 🎭 Gestão de Comics (Comediantes)
- **Cadastro completo**: Informações dos comediantes incluindo foto, cidade, redes sociais
- **Sistema de classes**: Classificação dos comediantes em níveis S, A, B, C
- **Performance tracking**: Acompanhamento da média de ingressos vendidos por comediante
- **Filtros e busca**: Sistema avançado de busca e filtragem por classe, cidade, etc.
- **Histórico de shows**: Visualização de todos os shows em que cada comediante participou

**Complete registration**: Comedian information including photo, city, social media | **Class system**: Classification of comedians into S, A, B, C levels | **Performance tracking**: Tracking of average tickets sold per comedian | **Filters and search**: Advanced search and filtering system by class, city, etc. | **Show history**: View of all shows each comedian has participated in**

### 📦 Estoque
- **Gestão completa de inventário**: Controle de todos os itens do bar e produtos
- **Categorias organizadas**: Cerveja, vinho, destilados, refrigerantes, petiscos, descartáveis, etc.
- **Alertas de estoque baixo**: Notificações automáticas quando itens estão abaixo do mínimo
- **Histórico de transações**: Rastreamento completo de compras, vendas, ajustes e perdas
- **Cálculo de custos**: Controle de preço de custo e preço de venda por item
- **Múltiplas unidades**: Suporte para diferentes unidades de medida (unidade, ml, litro, kg, etc.)

**Complete inventory management**: Control of all bar items and products | **Organized categories**: Beer, wine, spirits, soft drinks, snacks, disposables, etc. | **Low stock alerts**: Automatic notifications when items are below minimum | **Transaction history**: Complete tracking of purchases, sales, adjustments, and losses | **Cost calculation**: Control of cost price and sale price per item | **Multiple units**: Support for different units of measurement (unit, ml, liter, kg, etc.)**

### 🍺 Bar
- **Sessões de bar**: Criação e gerenciamento de sessões vinculadas a shows
- **Sistema de comandas**: Gestão de até 50 comandas por sessão
- **Controle de vendas**: Registro de itens vendidos com preços e custos
- **Múltiplos métodos de pagamento**: Dinheiro, cartão e PIX
- **Descontos**: Sistema de descontos por comanda
- **Relatórios de lucro**: Cálculo automático de receita, custo e lucro por sessão
- **Integração com estoque**: Redução automática do estoque ao realizar vendas

**Bar sessions**: Creation and management of sessions linked to shows | **Comanda system**: Management of up to 50 comandas per session | **Sales control**: Recording of sold items with prices and costs | **Multiple payment methods**: Cash, card, and PIX | **Discounts**: Discount system per comanda | **Profit reports**: Automatic calculation of revenue, cost, and profit per session | **Stock integration**: Automatic stock reduction when making sales**

### 💰 Financeiro
- **Relatórios completos**: Visualização de receitas, custos e lucros
- **Análise por período**: Filtros por data para análise temporal
- **Receita de ingressos**: Acompanhamento separado da receita de ingressos
- **Receita do bar**: Análise detalhada das vendas do bar
- **Cálculo de lucro**: Lucro líquido considerando custos de estoque
- **Métricas de performance**: Média de receita por show, ticket médio, etc.

**Complete reports**: Visualization of revenues, costs, and profits | **Period analysis**: Date filters for temporal analysis | **Ticket revenue**: Separate tracking of ticket revenue | **Bar revenue**: Detailed analysis of bar sales | **Profit calculation**: Net profit considering stock costs | **Performance metrics**: Average revenue per show, average ticket, etc.**

## Tecnologias Utilizadas / Technology Stack 💻

### Frontend
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior segurança de código
- **TailwindCSS**: Framework CSS utility-first para estilização
- **shadcn/ui**: Componentes UI modernos e acessíveis
- **Lucide React**: Biblioteca de ícones
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de schemas
- **Recharts**: Gráficos e visualizações de dados
- **date-fns**: Manipulação de datas

**Next.js 14**: React framework with App Router | **TypeScript**: Static typing for greater code safety | **TailwindCSS**: Utility-first CSS framework for styling | **shadcn/ui**: Modern and accessible UI components | **Lucide React**: Icon library | **React Hook Form**: Form management | **Zod**: Schema validation | **Recharts**: Charts and data visualizations | **date-fns**: Date manipulation**

### Backend
- **Server Actions**: Ações do servidor do Next.js para operações de dados
- **Drizzle ORM**: ORM moderno e type-safe para PostgreSQL
- **PostgreSQL**: Banco de dados relacional
- **Lucia Auth**: Sistema de autenticação
- **Argon2**: Hash de senhas seguro

**Server Actions**: Next.js server actions for data operations | **Drizzle ORM**: Modern and type-safe ORM for PostgreSQL | **PostgreSQL**: Relational database | **Lucia Auth**: Authentication system | **Argon2**: Secure password hashing**

### Arquitetura / Architecture
- **Server Actions Pattern**: Uso de Server Actions ao invés de APIs REST quando possível
- **Service Layer**: Serviços chamados pelas actions para lógica de negócio
- **Type Safety**: TypeScript em todo o projeto com tipos inferidos do Drizzle
- **Component-based**: Arquitetura baseada em componentes reutilizáveis

**Server Actions Pattern**: Use of Server Actions instead of REST APIs when possible | **Service Layer**: Services called by actions for business logic | **Type Safety**: TypeScript throughout the project with types inferred from Drizzle | **Component-based**: Architecture based on reusable components**

## Instalação e Configuração / Installation and Setup

### Pré-requisitos / Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm, yarn, pnpm ou bun

**Node.js 18+ | PostgreSQL 12+ | npm, yarn, pnpm or bun**

### Passos / Steps

1. **Clone o repositório / Clone the repository**
```bash
git clone https://github.com/seu-usuario/ccapp.git
cd ccapp
```

2. **Instale as dependências / Install dependencies**
```bash
npm install
# ou / or
yarn install
# ou / or
pnpm install
```

3. **Configure as variáveis de ambiente / Configure environment variables**

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

**Create a `.env.local` file in the project root with the following variables:**

```env
# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/ccapp

# Auth (opcional / optional)
AUTH_SECRET=seu-secret-aqui

# Google Calendar import
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_CALENDAR_ENCRYPTION_KEY=uma-chave-longa-e-secreta
```

4. **Configure o banco de dados / Set up the database**

```bash
# Gere as migrações / Generate migrations
npm run db:generate

# Execute as migrações / Run migrations
npm run db:migrate

# (Opcional) Popule o banco com dados de exemplo / (Optional) Seed the database with sample data
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento / Start the development server**

```bash
npm run dev
# ou / or
yarn dev
# ou / or
pnpm dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

**The application will be available at [http://localhost:3000](http://localhost:3000)**

## Scripts Disponíveis / Available Scripts

- `npm run dev` - Inicia o servidor de desenvolvimento / Starts the development server
- `npm run build` - Cria a build de produção / Creates production build
- `npm run start` - Inicia o servidor de produção / Starts production server
- `npm run lint` - Executa o linter / Runs the linter
- `npm run test` - Executa os testes / Runs tests
- `npm run db:generate` - Gera migrações do Drizzle / Generates Drizzle migrations
- `npm run db:migrate` - Executa migrações / Runs migrations
- `npm run db:push` - Faz push do schema para o banco / Pushes schema to database
- `npm run db:studio` - Abre o Drizzle Studio / Opens Drizzle Studio
- `npm run db:seed` - Popula o banco com dados de exemplo / Seeds database with sample data

## Estrutura do Projeto / Project Structure

```
ccapp/
├── app/                    # App Router do Next.js
│   ├── (main)/            # Rotas principais (protegidas)
│   │   ├── calendar/      # Calendário de shows
│   │   ├── schedule/     # Agenda detalhada
│   │   ├── comics/       # Gestão de comediantes
│   │   ├── estoque/      # Gestão de estoque
│   │   ├── bar/          # Sistema de bar
│   │   ├── financeiro/   # Relatórios financeiros
│   │   └── home/         # Dashboard e ações
│   ├── api/              # Rotas de API (quando necessário)
│   └── page.tsx          # Página inicial (dashboard)
├── components/           # Componentes React reutilizáveis
│   └── ui/              # Componentes shadcn/ui
├── db/                  # Configuração do banco de dados
│   ├── schema.ts        # Schema do Drizzle
│   ├── migrations/      # Migrações do banco
│   └── seed.ts          # Script de seed
├── lib/                 # Utilitários e helpers
└── public/              # Arquivos estáticos
```

**`app/` - Next.js App Router | `components/` - Reusable React components | `db/` - Database configuration | `lib/` - Utilities and helpers | `public/` - Static files**

## Funcionalidades em Destaque / Highlighted Features

### Sistema de Classes de Comediantes / Comedian Class System
Os comediantes são classificados em níveis S, A, B, C, permitindo uma organização hierárquica e facilitando a criação de lineups balanceados.

**Comedians are classified into S, A, B, C levels, allowing hierarchical organization and facilitating the creation of balanced lineups.**

### Gestão Inteligente de Estoque / Smart Inventory Management
O sistema alerta automaticamente quando itens estão abaixo do estoque mínimo, calcula valores de estoque e rastreia todas as transações.

**The system automatically alerts when items are below minimum stock, calculates stock values, and tracks all transactions.**

### Integração Bar-Estoque / Bar-Stock Integration
Ao realizar vendas no bar, o estoque é automaticamente reduzido, mantendo o inventário sempre atualizado.

**When making bar sales, stock is automatically reduced, keeping inventory always up to date.**

### Relatórios Financeiros Detalhados / Detailed Financial Reports
Análise completa de receitas, custos e lucros com filtros por período e visualizações gráficas.

**Complete analysis of revenues, costs, and profits with period filters and graphical visualizations.**

## Contribuindo / Contributing

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

**Contributions are welcome! Feel free to open issues or pull requests.**

## Licença / License

Este projeto está sob a licença MIT.

**This project is licensed under the MIT License.**

## Autor / Author

Desenvolvido por illan

**Developed by illan**

---

**Nota**: Este projeto foi desenvolvido para uso em casas de comédia stand-up, oferecendo uma solução completa para gerenciamento operacional e financeiro.

**Note**: This project was developed for use in stand-up comedy clubs, offering a complete solution for operational and financial management.
