import { motion } from "motion/react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <motion.div
      className="scribble-bg flex min-h-screen flex-col items-center justify-center gap-8 py-12"
      animate={{ backgroundPosition: ["0px 0px, 0px 0px, 0px 0px, 0px 0px", "140px 140px, -160px 160px, 120px -120px, 0px 0px"] }}
      transition={{ repeat: Infinity, repeatType: "mirror", duration: 60, ease: "linear" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-white/10 bg-white/95 shadow-2xl">
          <CardContent className="flex flex-col items-center gap-4 pt-2 text-center">
            <motion.span
              className="text-7xl font-black"
              initial={{ rotate: -8, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.1 }}
            >
              404
            </motion.span>
            <h1 className="text-2xl font-bold">Page not found</h1>
            <p className="text-sm text-muted-foreground">
              Looks like this page got erased. Let&apos;s get you back to drawing.
            </p>
            <Button
              size="lg"
              className="bg-emerald-500 text-base font-bold hover:bg-emerald-600"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
