/**
 * Tradução on-the-fly usando o endpoint público do Google Translate
 * (client=gtx, sem key, sem cadastro). Resultados são cacheados
 * no localStorage para não repetir chamadas.
 */
import { useEffect, useState } from "react"

const CACHE_KEY = "booktrack:translations"

type Cache = Record<string, string>

function loadCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function saveCache(cache: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // quota cheia: ignora
  }
}

const memoryCache: Cache = loadCache()
const inflight = new Map<string, Promise<string>>()

export async function translateText(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 5000) return trimmed

  if (memoryCache[trimmed]) return memoryCache[trimmed]
  if (inflight.has(trimmed)) return inflight.get(trimmed)!

  const promise = (async () => {
    try {
      const params = new URLSearchParams({
        client: "gtx",
        dj: "1",
        sl: "auto",
        tl: "pt",
        dt: "t",
        q: trimmed,
      })
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?${params}`
      )
      if (!res.ok) throw new Error("Tradução indisponível")
      const data = await res.json()
      const translated: string = (data.sentences ?? [])
        .map((s: { trans?: string }) => s.trans ?? "")
        .join("")
      const result = translated.trim() || trimmed
      memoryCache[trimmed] = result
      saveCache(memoryCache)
      return result
    } catch {
      return trimmed
    } finally {
      inflight.delete(trimmed)
    }
  })()
  inflight.set(trimmed, promise)
  return promise
}

/** Componente pronto: renderiza um texto traduzido. */
export function T({
  text,
  className,
}: {
  text?: string
  className?: string
}) {
  const translated = useTranslated(text)
  return <span className={className}>{translated}</span>
}

/** Hook: devolve o texto traduzido (ou o original enquanto traduz). */
export function useTranslated(text?: string): string {
  const [out, setOut] = useState(text ?? "")
  useEffect(() => {
    if (!text) {
      setOut("")
      return
    }
    let alive = true
    setOut(text) // mostra original imediatamente
    translateText(text).then((t) => {
      if (alive) setOut(t)
    })
    return () => {
      alive = false
    }
  }, [text])
  return out
}
