import { useEffect, useState } from "react"

export type BookStatus = "want" | "reading" | "read"

export interface Book {
  key: string // id da obra na Open Library
  title: string
  author: string
  year?: number
  cover?: string
  description?: string
}

export interface BookEntry {
  bookKey: string
  book: Book // snapshot do livro quando salvo
  status: BookStatus
  rating?: number // 0-5
  review?: string
  addedAt: string
  finishedAt?: string
}

const STORAGE_KEY = "booktrack:entries"

export function loadEntries(): BookEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BookEntry[]
  } catch {
    return []
  }
}

export function saveEntries(entries: BookEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function useEntries() {
  const [entries, setEntries] = useState<BookEntry[]>(loadEntries)

  useEffect(() => {
    saveEntries(entries)
  }, [entries])

  return [entries, setEntries] as const
}

export function coverUrl(book: Book) {
  return book.cover ?? ""
}

/* Detalhes de obra (sinopse) — API também ilimitada */
export async function fetchBookDetails(key: string): Promise<Partial<Book>> {
  try {
    const res = await fetch(`https://openlibrary.org/works/${key}.json`)
    if (!res.ok) return {}
    const data: WorkDoc = await res.json()
    const desc =
      typeof data.description === "string"
        ? data.description
        : data.description?.value
    return { description: desc }
  } catch {
    return {}
  }
}

interface WorkDoc {
  description?: string | { value?: string }
}

export async function searchBooks(query: string): Promise<Book[]> {
  // Open Library em inglês (variedade máxima), tradução PT na exibição.
  return fetchOpenLibrary(query, "eng")
}

/* Open Library: fonte única (API 100% livre — sem quota, sem key) */
async function fetchOpenLibrary(query: string, language?: string): Promise<Book[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "40",
    fields: "key,title,author_name,first_publish_year,cover_i",
  })
  if (language) params.set("language", language)
  const res = await fetch(`https://openlibrary.org/search.json?${params}`)
  if (!res.ok) throw new Error("Busca indisponível")
  const data = await res.json()
  interface SearchDoc {
    key: string
    title: string
    author_name?: string[]
    first_publish_year?: number
    cover_i?: number
  }
  return ((data.docs ?? []) as SearchDoc[])
    .filter((doc) => !!doc.cover_i) // só resultados com capa
    .map((doc) => ({
    key: doc.key.replace("/works/", ""),
    title: doc.title,
    author: doc.author_name?.[0] ?? "Autor desconhecido",
    year: doc.first_publish_year,
    cover: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : undefined,
  }))
}
