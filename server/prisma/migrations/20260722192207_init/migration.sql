-- CreateTable
CREATE TABLE "word_packs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "words" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "word_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "room_code" TEXT NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "players" JSONB NOT NULL,
    "rounds" INTEGER NOT NULL,
    "word_pack_id" TEXT,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);
