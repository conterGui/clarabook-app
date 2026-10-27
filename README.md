# ClaraBook 📚🍂

Estante pessoal de livros com reviews — estilo Letterboxd, mas **sem** parte social: só você, seus livros e suas notas.

## Stack

- **React + Vite + TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **Open Library API** (busca/us catalog — ilimitada, sem key) com filtro de edições em inglês
- **Google Translate `gtx`** (tradução PT na hora de exibir, com cache local)
- Dados salvos no **localStorage** do navegador

## Funcionalidades

- 🔍 Buscar livros (capa, título, autor, ano)
- 📚 Estante visual com capas e abas: Todos / Lendo / Lidos / Quero ler
- ✍️ Review pessoal: nota em estrelas (1–5) + texto livre + status
- ⚙️ Recomendações: motor local que mistura seus autores favoritos + assuntos recorrentes (subjects da Open Library), ponderados pelas suas notas
- 🇧🇷 Títulos e autores traduzidos em tempo real
- 🍂 Tema de outono (bege / marrom / musgo / terracota)

## Rodar

```sh
npm install
npm run dev
```

## Estrutura

```
src/
  lib/          # API de livros, tradução, motor de recomendações
  components/   # ui (shadcn), dia log de busca, dialog de review
  App.tsx       # estante, abas e integração
```
