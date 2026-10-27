/**
 * Motor de recomendação local:
 * — Perfil: autores e "assuntos" (subjects da Open Library) das obras na estante,
 *   ponderados pelas notas (rating 4-5 pesa mais; "quero ler" revela interesse).
 * — Candidatos: buscas para top autores e top assuntos.
 * — Score: afinidade por assunto + afinidade por autor + bônus de busca.
 */
import { searchBooks, fetchBookDetails, type Book, type BookEntry } from "./books"

const SUBJECTS_KEY = "booktrack:subjects"
const SUBJECTS_LIMIT = 12 // quantas obras serão usadas para mapear interesses

interface SubjectCache {
  [key: string]: string[]
}

function loadSubjects(): SubjectCache {
  try {
    return JSON.parse(localStorage.getItem(SUBJECTS_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function saveSubjects(cache: SubjectCache) {
  try {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(cache))
  } catch {
    // ignora quota
  }
}

const subjectCache: SubjectCache = loadSubjects()

async function fetchSubjects(key: string): Promise<string[]> {
  if (subjectCache[key]) return subjectCache[key]
  try {
    const res = await fetch(`https://openlibrary.org/works/${key}.json`)
    if (!res.ok) return []
    const data: { subjects?: string[] } = await res.json()
    const subjects = (data.subjects ?? [])
      .flatMap((s: string) => s.split(/[,(]| -- /i)) // "New York (State), romance" vira tokens
      .map((s: string) => s.trim())
      .filter(
        (s: string) =>
          s.length > 2 &&
          s.length < 40 &&
          !/^\d/.test(s) &&
          !/nyt|new york times|bestseller/i.test(s)
      )
    subjectCache[key] = subjects
    saveSubjects(subjectCache)
    return subjects
  } catch {
    return []
  }
}

export interface Recommendation {
  book: Book
  reason: string
}

export async function getRecommendations(
  entries: BookEntry[],
  limit = 12
): Promise<Recommendation[]> {
  const shelfKeys = new Set(entries.map((e) => e.bookKey))

  // ----- perfil do usuário -----
  const authorScore: Record<string, number> = {}
  const subjectScore: Record<string, number> = {}
  const interesting = entries
    .slice()
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, SUBJECTS_LIMIT)

  const subjectsLists = await Promise.all(
    interesting.map((e) => fetchSubjects(e.bookKey))
  )

  interesting.forEach((e, i) => {
    const weight =
      e.status === "want" ? 1.5 : e.status === "read" ? (e.rating ?? 2) : 1
    if (weight <= 0) return
    const author = e.book.author.replace(/^(Autor desconhecido)$/i, "").trim()
    if (author) authorScore[author] = (authorScore[author] ?? 0) + weight
    for (const s of subjectsLists[i]) {
      const token = s.toLowerCase()
      subjectScore[token] = (subjectScore[token] ?? 0) + weight
    }
  })

  const topAuthors = Object.entries(authorScore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([a]) => a)
  const topSubjects = Object.entries(subjectScore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([s]) => s)

  // ----- busca de candidatos -----
  const queries: { q: string; label: string; field: "author" | "subject" }[] = [
    ...topAuthors.map((a) => ({
      q: `author:"${a}"`,
      label: a,
      field: "author" as const,
    })),
    ...topSubjects.map((s) => ({
      q: `subject:${s}`,
      label: s,
      field: "subject" as const,
    })),
  ]

  const results = await Promise.allSettled(
    queries.map((query) => searchBooks(query.q))
  )

  const candidateMap = new Map<string, { book: Book; score: number; reasons: Set<string> }>()

  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return
    const query = queries[i]
    r.value.forEach((book, rank) => {
      if (shelfKeys.has(book.key)) return
      const prev = candidateMap.get(book.key) ?? {
        book,
        score: 0,
        reasons: new Set<string>(),
      }
      // ranking interno da busca também é sinal
      const appearBonus = Math.max(0, 3 - Math.floor(rank / 8))
      prev.score += appearBonus
      if (query.field === "author") {
        prev.score += 4
        prev.reasons.add(`autor ${query.label}`)
      } else {
        prev.score += 2.5
        prev.reasons.add(query.label)
      }
      candidateMap.set(book.key, prev)
    })
  })

  return [...candidateMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => ({
      book: c.book,
      reason: [...c.reasons].slice(0, 2).join(" + "),
    }))
}

/** busca de assuntos da obra (wrapper para uso externo se necessário) */
export { fetchBookDetails }
export type { Book }
