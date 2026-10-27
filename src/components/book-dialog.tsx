import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTranslated } from "@/lib/translate"
import {
  coverUrl,
  type Book,
  type BookEntry,
  type BookStatus,
} from "@/lib/books"

const AUTHOR_MAX = 32

function fmtDate(iso?: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

interface Props {
  book: Book | null
  entry?: BookEntry
  onOpenChange: () => void
  onSave: (entry: BookEntry) => void
  onRemove: (bookKey: string) => void
}

export function BookDialog({ book, entry, onOpenChange, onSave, onRemove }: Props) {
  const [status, setStatus] = useState<BookStatus>(entry?.status ?? "read")
  const [rating, setRating] = useState<number>(entry?.rating ?? 0)
  const [review, setReview] = useState<string>(entry?.review ?? "")
  const [finishedAt, setFinishedAt] = useState<string>(entry?.finishedAt ?? "")

  useEffect(() => {
    if (!book) return
    setStatus(entry?.status ?? "read")
    setRating(entry?.rating ?? 0)
    setReview(entry?.review ?? "")
    setFinishedAt(entry?.finishedAt ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.key])

  const author = book
    ? book.author.length > AUTHOR_MAX
      ? book.author.slice(0, AUTHOR_MAX) + "…"
      : book.author
    : ""
  const translatedTitle = useTranslated(book?.title)

  if (!book) return null

  function handleSave() {
    const isFinished = status === "read"
    onSave({
      bookKey: book!.key,
      book: book!,
      status,
      rating: rating > 0 ? rating : undefined,
      review: review.trim() || undefined,
      addedAt: entry?.addedAt ?? new Date().toISOString(),
      finishedAt: isFinished
        ? finishedAt || entry?.finishedAt || new Date().toISOString()
        : undefined,
    })
    onOpenChange()
  }

  return (
    <Dialog open={!!book} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex gap-5">
          <div className="w-32 shrink-0">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-md border bg-muted shadow">
              {coverUrl(book) ? (
                <img
                  src={coverUrl(book)}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
                  Sem capa
                </div>
              )}
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              {fmtDate(entry?.finishedAt) ? `lido em ${fmtDate(entry?.finishedAt)}` : ""}
            </p>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl leading-snug">
                {translatedTitle}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {author}
              {book.year ? ` · ${book.year}` : ""}
            </p>
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Minha nota
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(rating === n ? 0 : n)}
                    className={cn(
                      "text-2xl transition hover:scale-110",
                      n <= rating ? "text-amber-500" : "text-muted-foreground/40"
                    )}
                    aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <Select value={status} onValueChange={(v) => setStatus(v as BookStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want">Quero ler</SelectItem>
                  <SelectItem value="reading">Lendo</SelectItem>
                  <SelectItem value="read">Lido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Minha resenha
          </p>
          <Textarea
            rows={5}
            placeholder="O que achou do livro? Anote sua review pessoal..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
        </div>

        <DialogFooter className="sm:justify-between">
          {entry ? (
            <Button
              variant="ghost"
              onClick={() => {
                onRemove(book.key)
                onOpenChange()
              }}
              className="text-destructive hover:text-destructive"
            >
              Remover da estante
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onOpenChange}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
