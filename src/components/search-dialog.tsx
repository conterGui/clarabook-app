import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { searchBooks, coverUrl, type Book } from "@/lib/books"
import { T } from "@/lib/translate"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (book: Book) => void
  addedKeys: string[]
}

export function SearchDialog({ open, onOpenChange, onAdd, addedKeys }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const books = await searchBooks(query)
      setResults(books)
      setSearched(true)
    } catch {
      setResults([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif">Adicionar livro</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por título, autor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3 overflow-y-auto py-2 sm:grid-cols-4">
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          {results.map((book) => {
            const added = addedKeys.includes(book.key)
            return (
              <button
                key={book.key}
                onClick={() => !added && onAdd(book)}
                className={`text-left group transition ${added ? "opacity-40" : "hover:-translate-y-1"}`}
              >
                <div className="aspect-[2/3] w-full overflow-hidden rounded-md border bg-muted shadow-sm">
                  {coverUrl(book) ? (
                    <img
                      src={coverUrl(book)}
                      alt={book.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                      Sem capa
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium leading-tight">
                  <T text={book.title} />
                </p>
                <p className="line-clamp-1 text-[10px] text-muted-foreground">
                  {book.author}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {added ? "✓ Na estante" : book.year || ""}
                </p>
                {!added && (
                  <p className="text-[10px] text-primary opacity-0 transition group-hover:opacity-100">
                    adicionar à estante
                  </p>
                )}
              </button>
            )
          })}
          {!loading && searched && results.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              Nenhum livro encontrado.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
