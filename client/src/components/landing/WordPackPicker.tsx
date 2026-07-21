import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createWordPack, listWordPacks, type WordPackSummary } from "@/lib/wordPacks"

interface WordPackPickerProps {
  value: string
  onChange: (packId: string) => void
}

export function WordPackPicker({ value, onChange }: WordPackPickerProps) {
  const [packs, setPacks] = useState<WordPackSummary[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [wordsText, setWordsText] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listWordPacks().then(setPacks)
  }, [])

  const handleCreate = async () => {
    const words = wordsText
      .split(/[,\n]/)
      .map((w) => w.trim())
      .filter(Boolean)
    if (words.length < 3) return toast.error("Add at least 3 words")

    setSaving(true)
    try {
      const pack = await createWordPack(name || "Custom pack", words)
      if (!pack) return toast.error("Couldn't save that word pack")
      setPacks((prev) => [...prev, pack])
      onChange(pack.id)
      setDialogOpen(false)
      setName("")
      setWordsText("")
      toast.success(`"${pack.name}" pack created`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Word pack" />
        </SelectTrigger>
        <SelectContent>
          {packs.map((pack) => (
            <SelectItem key={pack.id} value={pack.id}>
              {pack.name} ({pack.wordCount})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon" aria-label="Create custom word pack">
            <Plus className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a custom word pack</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input placeholder="Pack name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            <Textarea
              placeholder="Words, separated by commas or one per line…"
              value={wordsText}
              onChange={(e) => setWordsText(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={saving}>
              Save pack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
