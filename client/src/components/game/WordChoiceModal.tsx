import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface WordChoiceModalProps {
  words: string[]
  onChoose: (word: string) => void
}

export function WordChoiceModal({ words, onChoose }: WordChoiceModalProps) {
  return (
    <Dialog open>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">Choose a word to draw</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          {words.map((word) => (
            <Button key={word} size="lg" variant="outline" className="capitalize" onClick={() => onChoose(word)}>
              {word}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
