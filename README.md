# 💰 Meus Gastos - Controle Financeiro Pessoal

> **Meus Gastos** é um aplicativo mobile simples, rápido e *offline-first* para controle de finanças pessoais. Desenvolvido com **React Native**, **Expo** e **SQLite**, o app permite organizar suas despesas com um exclusivo sistema de **Tripla Categorização** (Gasto, Origem do Dinheiro e Tipo de Pagamento).

---

## 📱 Para Usuários: Como Baixar e Usar no Celular (APK)

Se você quer apenas instalar e usar o aplicativo no seu smartphone Android sem precisar mexer em código:

### 1. Download do Aplicativo
- Acesse a aba de **[Releases](https://github.com/andrejonasminati/app_financas/releases)** no GitHub.
- Baixe o arquivo mais recente com a extensão `.apk` (ex: `MeusGastos.apk`).

### 2. Passo a Passo para Instalar no Android
1. Após concluir o download, abra o arquivo `.apk` no seu celular.
2. Caso seja exibido um aviso do sistema, ative a opção **"Permitir desta fonte"** ou **"Instalar aplicativos de fontes desconhecidas"**.
3. Confirme a instalação e abra o aplicativo **Meus Gastos**.
4. Pronto! Seus dados ficarão salvos **100% no seu próprio celular** (sem necessidade de internet).

---

## ✨ Principais Funcionalidades

- 🎯 **Tripla Categorização Exclusiva:**
  - **Subcategoria de Gasto:** O que foi comprado (*ex: Alimentação, Mercado, Moradia, Saúde*).
  - **Origem do Dinheiro:** De onde saiu o recurso (*ex: Banco Sicredi, Mercado Pago, Dinheiro em mãos*).
  - **Tipo de Pagamento:** Como a transação foi realizada (*ex: Pix, Cartão de Crédito, Débito, Dinheiro*).
- 📅 **Filtros Flexíveis por Período:**
  - Mês Atual, Mês Específico, Intervalo Personalizado de Meses, Trimestre, Semestre e Ano.
- 📊 **Relatórios & Ranking por Categoria/Origem:**
  - Visualize o valor total gasto, média diária, a top categoria do mês e o percentual de cada gasto.
- 🔍 **Detalhamento por Categoria:**
  - Toque em qualquer categoria para listar apenas os gastos daquele período selecionado.
- 🗑️ **Lixeira Inteligente (Soft Delete):**
  - Excluiu um gasto por engano? Restaure facilmente na aba Lixeira ou remova definitivamente.
- 🇧🇷 **Padrão Brasileiro (BRL):**
  - Valores formatados em reais (`R$ 1.250,50`) e datas no formato `DD/MM/AAAA`.
- 🌙 **Modo Claro / Modo Escuro:**
  - Adapta-se automaticamente ao tema do seu dispositivo.

---

## 💻 Para Desenvolvedores: Como Modificar e Rodar o Projeto

Se você é desenvolvedor e quer contribuir, personalizar ou criar sua própria versão do aplicativo:

### 🛠️ Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Git**
- Aplicativo **Expo Go** instalado no seu celular (Android ou iOS) para testar

### 🚀 Rodando o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/andrejonasminati/app_financas.git
   cd app_financas
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento do Expo:**
   ```bash
   npx expo start --go
   ```

4. **Testando no dispositivo:**
   - Abra o **Expo Go** no seu celular.
   - Escaneie o **QR Code** exibido no seu terminal (ou insira o endereço `exp://<SEU_IP>:8081`).

---

## 📁 Estrutura de Pastas do Projeto

```text
finance control/
├── app/                      # Telas e Rotas (Expo Router)
│   ├── (tabs)/               # Abas principais (Listagem e Relatório)
│   ├── category-expenses.tsx # Tela de Detalhes da Categoria
│   ├── configuracoes.tsx     # Tela de Ajustes do App
│   ├── edicao.tsx            # Gerenciamento de Categorias
│   ├── modal.tsx             # Formulário de Adicionar/Editar Gasto
│   └── trash.tsx             # Lixeira de Itens Excluídos
├── assets/                   # Ícones, imagens e splash screen
├── database/                 # Inicialização do banco SQLite (WAL mode + Indexes)
├── context/                  # Contextos globais (Tema e Autenticação)
├── hooks/                    # Custom hooks (Cores e Temas)
└── utils/                    # Formatadores (Moeda BRL e Data DD/MM/AAAA)
```

---

## 📄 Licença

Este projeto é de código aberto e está disponível para estudos, modificações e melhorias. Sinta-se à vontade para fazer um **fork** e contribuir!

---

<p align="center">Desenvolvido com ❤️ usando React Native & Expo</p>
