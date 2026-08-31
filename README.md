# Ciclo Montessori

App pessoal para montar ciclos de trabalho no modelo montessoriano (Para
aquecer → Básico → Intermediário → Avançado → Fazer mais), cruzando o
conteúdo de várias editoras por unidade e exportando o resultado em `.docx`.

Feito para rodar localmente no seu computador — não precisa de servidor
nem de internet depois de instalado.

## Como funciona

1. **Unidade** — cadastre a unidade do currículo (ex: "Unidade 10 —
   Diversidade dos seres vivos"), com os objetivos e o sumário/tópicos do
   livro-base.
2. **Fontes** — cadastre as editoras usadas (Saber+, Telaris, Panoramas,
   Araribá Plus...) e, na matriz de cobertura, informe em quais páginas cada
   editora cobre cada tópico do sumário e se já traz exercícios fechados.
   Também dá pra fazer isso automaticamente: em **"+ Analisar fotos com
   IA"**, anexe fotos das páginas do livro e a IA (Claude) já sugere os
   tópicos, páginas e se tem exercício — você revisa e confirma antes de
   salvar. Requer configurar `ANTHROPIC_API_KEY` no `.env` (veja abaixo);
   sem a chave, o resto do app funciona normalmente, só essa função fica
   indisponível.
3. **Diagnóstico de buracos** — a própria unidade mostra quais tópicos do
   sumário ainda não têm nenhuma fonte cadastrada ou nenhuma atividade em
   nenhum ciclo.
4. **Ciclo** — crie um ciclo vinculado à unidade, defina quantas
   semanas/aulas por semana ele tem, e monte as atividades dentro dos 5
   níveis. Cada atividade pode referenciar uma fonte, um tópico do sumário,
   a página, e se é para fazer em sala ou em casa.
5. **Distribuição por aula** — o botão "Distribuir automaticamente" espalha
   as atividades marcadas "em sala" pelas aulas disponíveis (semanas × aulas
   por semana), respeitando a ordem dos níveis. Atividades "em casa" ficam
   fora da grade de aula.
6. **Exportar .docx** — gera o documento final do ciclo, pronto para
   imprimir/aplicar, com objetivos, tabela de distribuição por aula e todas
   as atividades organizadas por nível.

## Rodando localmente

Pré-requisitos: [Node.js](https://nodejs.org/) 20 ou mais recente.

### Opção fácil: arquivo de clique duplo

- **Windows**: dê duplo clique em `Iniciar-Windows.bat`.
- **Mac**: dê duplo clique em `Iniciar-Mac.command`.

Na primeira vez, o Windows pode mostrar um aviso do SmartScreen ("O Windows
protegeu o computador") — clique em **"Mais informações"** → **"Executar
assim mesmo"**. No Mac, o Gatekeeper pode bloquear o arquivo — clique com o
botão direito nele → **"Abrir"** → confirme.

O script instala tudo que falta na primeira vez (pode demorar alguns
minutos), prepara o banco local e abre `http://localhost:3000` sozinho no
navegador. Para encerrar o app, feche a janela do terminal que abriu ou
aperte `Ctrl+C` nela. Nas próximas vezes é só dar duplo clique de novo.

### Opção manual (linha de comando)

```bash
npm install          # instala as dependências e gera o client do Prisma
cp .env.example .env # cria o arquivo de configuração do banco local
npx prisma migrate deploy   # cria o banco sqlite local (dev.db)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Da próxima vez, basta rodar `npm run dev` de novo (o `dev.db` já existe e
guarda tudo que você cadastrou).

### Configurando a leitura de fotos por IA (opcional)

1. Pegue uma chave em [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   (precisa de uma conta com créditos/cobrança ativada).
2. Abra o arquivo `.env` na pasta do projeto (crie a partir do
   `.env.example` se ainda não existir) e cole a chave:
   ```
   ANTHROPIC_API_KEY="sk-ant-..."
   ```
3. Salve o arquivo e reinicie o app (feche a janela preta e abra o
   `Iniciar-Windows.bat`/`Iniciar-Mac.command` de novo, ou `npm run dev`).

Custo: cada leva de fotos analisada custa poucos centavos de dólar (a
chamada usa o modelo Claude Sonnet 5) — cobrado direto na sua conta
Anthropic, fora do app.

## Stack

- [Next.js](https://nextjs.org/) (App Router, Server Actions) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) para estilo
- [Prisma](https://www.prisma.io/) + SQLite (`better-sqlite3`) para os dados,
  guardados localmente em `dev.db`
- [`docx`](https://www.npmjs.com/package/docx) para gerar o arquivo `.docx`
  final
- [Anthropic SDK](https://www.npmjs.com/package/@anthropic-ai/sdk) (Claude
  Sonnet 5) para a leitura de fotos das páginas

## Comandos úteis

```bash
npm run dev         # sobe o app em modo desenvolvimento
npm run build        # build de produção
npm run db:studio    # abre o Prisma Studio (interface visual do banco)
npm run db:migrate   # aplica alterações no schema (prisma/schema.prisma)
```

## Modelo de dados (resumo)

- `Unit` — a unidade do currículo, com `Objective`s e `Topic`s (sumário).
- `Source` — um livro/editora usado na unidade.
- `SourceTopic` — em quais páginas cada `Source` cobre cada `Topic`, e se
  tem exercícios fechados prontos.
- `Cycle` — o ciclo de trabalho em si (semanas, aulas por semana).
- `Activity` — uma atividade dentro de um dos 5 níveis do ciclo, podendo
  referenciar uma `Source`, um `Topic`, e ficar marcada como em sala/em casa
  e associada a um número de aula.
