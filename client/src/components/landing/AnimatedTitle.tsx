import { motion } from "motion/react"

const TITLE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899"]
const LETTERS = "scribble".split("")

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const letter = {
  hidden: { opacity: 0, y: -40, scale: 0.4, rotate: -15 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, damping: 10, stiffness: 200 },
  },
}

export function AnimatedTitle() {
  return (
    <motion.h1
      className="scribble-title flex text-6xl font-black tracking-tight sm:text-7xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {LETTERS.map((char, i) => (
        <motion.span key={i} variants={letter} style={{ color: TITLE_COLORS[i % TITLE_COLORS.length] }}>
          <motion.span
            className="inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 + i * 0.12, ease: "easeInOut" }}
            whileHover={{ scale: 1.3, rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
          >
            {char}
          </motion.span>
        </motion.span>
      ))}
    </motion.h1>
  )
}
