import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchDialog } from "@/components/search-dialog"
import { BookDialog } from "@/components/book-dialog"
import {
  useEntries,
  coverUrl,
  type Book,
  type BookEntry,
  type BookStatus,
} from "@/lib/books"
import {
  getRecommendations,
  type Recommendation,
} from "@/lib/recommend"
import { T } from "@/lib/translate"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"


type Tab = BookStatus | "all" | "recs"

interface Selected {
  book: Book
  entry?: BookEntry
}

function RecommendationsSection({
  recs,
  loading,
  onOpen,
}: {
  recs: Recommendation[]
  loading: boolean
  onOpen: (sel: Selected) => void
}) {
  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }
  if (recs.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-muted-foreground">
        Não conseguimos achar algo parecido ainda — avalie mais uns livros 🙂
      </p>
    )
  }
  return (
    <div className="mt-6 grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {recs.map((rec) => (
        <button
          key={rec.book.key}
          onClick={() => onOpen({ book: rec.book })}
          className="group text-left"
        >
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border bg-muted shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg">
            {coverUrl(rec.book) ? (
              <img
                src={coverUrl(rec.book)}
                alt={rec.book.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                {rec.book.title}
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 line-clamp-1 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-4 text-[9px] font-medium text-amber-300 italic">
              {rec.reason}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs font-medium leading-tight">
            <T text={rec.book.title} />
          </p>
          <p className="line-clamp-1 text-[10px] text-muted-foreground">
            {rec.book.author}
          </p>
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [entries, setEntries] = useEntries()
  const [searchOpen, setSearchOpen] = useState(false)
  const [selected, setSelected] = useState<{ book: Book; entry?: BookEntry } | null>(null)
  const [tab, setTab] = useState<Tab>("all")
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [recsLoading, setRecsLoading] = useState(false)

  const shelfSignature = useMemo(
    () => entries.map((e) => `${e.bookKey}:${e.status}:${e.rating ?? 0}`).join("|"),
    [entries]
  )
  useEffect(() => {
    if (tab !== "recs" || entries.length === 0) return
    let alive = true
    setRecsLoading(true)
    getRecommendations(entries).then((r) => {
      if (alive) {
        setRecs(r)
        setRecsLoading(false)
      }
    })
    return () => {
      alive = false
    }
    // recomputa quando a estante muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, shelfSignature])

  const filtered = useMemo(
    () => (tab === "all" ? entries : entries.filter((e) => e.status === tab)),
    [entries, tab]
  )

  const stats = useMemo(
    () => ({
      total: entries.length,
      read: entries.filter((e) => e.status === "read").length,
      reading: entries.filter((e) => e.status === "reading").length,
      want: entries.filter((e) => e.status === "want").length,
      rated: entries.filter((e) => e.rating).length,
      avg: (() => {
        const r = entries.filter((e) => e.rating)
        return r.length ? r.reduce((s, e) => s + (e.rating ?? 0), 0) / r.length : 0
      })(),
    }),
    [entries]
  )

  function handleSave(entry: BookEntry) {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.bookKey === entry.bookKey)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = entry
        return copy
      }
      return [entry, ...prev]
    })
  }

  function handleRemove(bookKey: string) {
    setEntries((prev) => prev.filter((e) => e.bookKey !== bookKey))
  }

  function handleAdd(book: Book) {
    setEntries((prev) =>
      prev.some((e) => e.bookKey === book.key)
        ? prev
        : [
            {
              bookKey: book.key,
              book,
              status: "want",
              addedAt: new Date().toISOString(),
            },
            ...prev,
          ]
    )
    setSearchOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <h1 className="font-serif text-xl font-bold tracking-tight">
            ClaraBook<span className="text-amber-600 dark:text-amber-500">.</span>
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right text-xs leading-tight text-muted-foreground sm:block">
              <span className="font-semibold text-foreground">{stats.read}</span> lidos ·{" "}
              <span className="font-semibold text-foreground">{stats.total}</span> na estante
              {stats.avg > 0 && (
                <>
                  {" · "}média{" "}
                  <span className="font-semibold text-foreground">
                    {stats.avg.toFixed(1)}★
                  </span>
                </>
              )}
            </div>
            <Button onClick={() => setSearchOpen(true)}>+ Adicionar livro</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="all">
              Todos <Badge variant="secondary">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="reading">
              Lendo <Badge variant="secondary">{stats.reading}</Badge>
            </TabsTrigger>
            <TabsTrigger value="read">
              Lidos <Badge variant="secondary">{stats.read}</Badge>
            </TabsTrigger>
            <TabsTrigger value="want">
              Quero ler <Badge variant="secondary">{stats.want}</Badge>
            </TabsTrigger>
            <TabsTrigger value="recs">
              Recomendados <Sparkles className="size-3.5 text-amber-500" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "recs" ? (
          stats.total === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="font-serif text-2xl text-muted-foreground">
                Precisamos conhecer seu gosto ✦
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Adicione e avalie alguns livros, e a ClaraBook passa a recomendar
                títulos parecidos com o que você ama.
              </p>
              <Button variant="outline" onClick={() => setSearchOpen(true)}>
                Adicionar o primeiro livro
              </Button>
            </div>
          ) : (
            <RecommendationsSection recs={recs} loading={recsLoading} onOpen={setSelected} />
          )
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="font-serif text-2xl text-muted-foreground">
              Sua estante está vazia ✦
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Busque livros, coloque-os na prateleira e anote suas reviews pessoais —
              sem feed, sem rede social, só você e seus livros.
            </p>
            <Button variant="outline" onClick={() => setSearchOpen(true)}>
              Buscar um livro
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {filtered.map((entry) => (
              <button
                key={entry.bookKey}
                onClick={() => setSelected({ book: entry.book, entry })}
                className="group text-left"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border bg-muted shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg">
                  {coverUrl(entry.book) ? (
                    <img
                      src={coverUrl(entry.book)}
                      alt={entry.book.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                      {entry.book.title}
                    </div>
                  )}
                  {tab === "all" && (
                    <span
                      className={cn(
                        "absolute left-1.5 top-1.5 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow",
                        entry.status === "reading" && "bg-[#6b7f45]", // musgo
                        entry.status === "read" && "bg-[#a34d2c]", // terracota
                        entry.status === "want" && "bg-[#9b7e3f]", // mostarda
                      )}
                    >
                      {entry.status === "reading"
                        ? "lendo"
                        : entry.status === "read"
                          ? "lido"
                          : "quero"}
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium leading-tight">
                  <T text={entry.book.title} />
                </p>
                <p className="line-clamp-1 text-[10px] text-muted-foreground">
                  {entry.book.author}
                </p>
                {entry.rating ? (
                  <p className="text-[11px] text-amber-500">
                    {"★".repeat(entry.rating)}
                  </p>
                ) : (
                  <p className="text-[11px] text-transparent">—</p>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Dados de livro via Open Library · Sua estante fica salva localmente no navegador
      </footer>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onAdd={handleAdd}
        addedKeys={entries.map((e) => e.bookKey)}
      />

      <BookDialog
        book={selected?.book ?? null}
        entry={selected?.entry}
        onOpenChange={() => setSelected(null)}
        onSave={handleSave}
        onRemove={handleRemove}
      />
      <Toaster />
    </div>
  )
}
