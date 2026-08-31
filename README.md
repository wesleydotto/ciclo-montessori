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

```bash
npm install          # instala as dependências e gera o client do Prisma
cp .env.example .env # cria o arquivo de configuração do banco local
npx prisma migrate deploy   # cria o banco sqlite local (dev.db)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Da próxima vez, basta rodar `npm run dev` de novo (o `dev.db` já existe e
guarda tudo que você cadastrou).

## Stack

- [Next.js](https://nextjs.org/) (App Router, Server Actions) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) para estilo
- [Prisma](https://www.prisma.io/) + SQLite (`better-sqlite3`) para os dados,
  guardados localmente em `dev.db`
- [`docx`](https://www.npmjs.com/package/docx) para gerar o arquivo `.docx`
  final

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
