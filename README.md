# Meus Gastos - Controle Financeiro Pessoal

**Meus Gastos** é um aplicativo mobile simples, rápido e *offline-first* para controle de finanças pessoais. Desenvolvido com React Native, Expo e SQLite, o app permite organizar suas despesas através de um sistema de **Tripla Categorização** (Gasto, Origem do Dinheiro e Tipo de Pagamento).

---
## Para Usuários: Como Baixar e Instalar o APK

Se você deseja apenas utilizar o aplicativo em seu dispositivo Android:

### 1. Download do Aplicativo
- Acesse a seção de **[Releases](https://github.com/andrejonasminati/app_financas/releases)** no repositório GitHub.
- Baixe o arquivo de instalação com extensão `.apk` (ex: `MeusGastos.apk`).

### 2. Instalação no Android
1. Abra o arquivo `.apk` baixado em seu dispositivo.
2. Caso o sistema solicite confirmação, habilite a permissão **"Permitir desta fonte"** ou **"Instalar aplicativos desconhecidos"**.
3. Confirme a instalação e abra o aplicativo **Meus Gastos**.
4. Todos os seus dados serão armazenados **100% localmente** em seu próprio aparelho.

---

## Primeiros Passos e Acesso Inicial

### Credenciais de Acesso Padrão
Ao abrir o aplicativo pela primeira vez, utilize as credenciais padrão:

- **Usuário:** `Admin`
- **Senha:** `123`

> **Como alterar sua senha:** Clique no ícone de engrenagem no canto superior direito para acessar a tela de **Configurações**. Nela, você poderá alterar a senha do usuário para garantir a segurança dos seus dados.

---

## Configuração Inicial das Categorias

Para realizar lançamentos de forma organizada, o sistema utiliza o conceito de **Tripla Categorização**. Antes de registrar suas despesas, acesse **Configurações > Gerenciar Categorias** para adaptar ou criar as categorias conforme sua rotina financeira.

Cada gasto registrado precisa estar vinculado a três dimensões:

1. **Subcategoria de Gasto (O que está sendo comprado):**
   - Refere-se à finalidade do consumo.
   - *Exemplos:* Alimentação, Mercado, Moradia, Saúde, Locomoção, Lazer.

2. **Origem do Dinheiro (De onde sai o recurso):**
   - Refere-se à conta ou carteira de onde o dinheiro é retirado.
   - *Exemplos:* Banco Sicredi, Mercado Pago, Conta Corrente, Carteira / Dinheiro Físico.

3. **Tipo de Pagamento (Como a transação é realizada):**
   - Refere-se à forma ou instrumento utilizado para efetuar o pagamento.
   - *Exemplos:* Pix, Cartão de Crédito, Cartão de Débito, Dinheiro.

---



## Principais Funcionalidades

- **Tripla Categorização:** Registro completo associando Gasto, Origem e Tipo de Pagamento.
- **Filtros por Período:** Consulta por Mês Atual, Mês Específico, Intervalo de Meses, Trimestre, Semestre e Ano.
- **Relatórios por Categoria e Origem:** Resumos com total gasto, média diária e distribuição percentual.
- **Detalhamento por Categoria:** Clique em qualquer categoria no relatório para visualizar os lançamentos individuais do período selecionado.
- **Lixeira (Soft Delete):** Itens excluídos vão para a lixeira, permitindo restauração ou exclusão definitiva.
- **Formatação no Padrão Brasileiro:** Moeda exibida em reais (`R$ 1.250,50`) e datas no formato `DD/MM/AAAA`.
- **Suporte a Tema Escuro e Claro:** Ajuste automático conforme as preferências do dispositivo.

---

## Para Desenvolvedores: Como Modificar e Executar o Projeto

Se você deseja personalizar, estender ou contribuir com o código-fonte:

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Git**
- Aplicativo **Expo Go** instalado no celular (Android ou iOS) para testes

### Execução Local

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/andrejonasminati/app_financas.git
   cd app_financas
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor do Expo:**
   ```bash
   npx expo start --go
   ```

4. **Testando no dispositivo:**
   - Abra o **Expo Go** no celular.
   - Escaneie o **QR Code** gerado no terminal.

---

## Estrutura de Pastas

```text
finance control/
├── app/                      # Telas e Rotas (Expo Router)
│   ├── (tabs)/               # Abas principais (Listagem e Relatório)
│   ├── category-expenses.tsx # Detalhes da Categoria
│   ├── configuracoes.tsx     # Configurações do App e Alteração de Senha
│   ├── edicao.tsx            # Gerenciamento de Categorias
│   ├── modal.tsx             # Inserção e Edição de Gastos
│   └── trash.tsx             # Lixeira de Itens Excluídos
├── assets/                   # Ícones, imagens e splash screen
├── database/                 # Inicialização do banco SQLite (WAL mode + Índices)
├── context/                  # Contextos globais (Tema e Autenticação)
├── hooks/                    # Hooks de tema e cores
└── utils/                    # Formatadores (Moeda BRL e Data DD/MM/AAAA)
```

---

## Licença

Este projeto é de código aberto e está disponível para estudos, modificações e contribuições.

<p align="center">Desenvolvido com React Native & Expo</p>

