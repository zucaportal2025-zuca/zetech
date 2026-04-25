-- CreateTable
CREATE TABLE "liturgical_days" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "season" TEXT NOT NULL,
    "seasonName" TEXT NOT NULL,
    "celebration" TEXT NOT NULL,
    "celebrationType" TEXT NOT NULL,
    "liturgicalColor" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "yearCycle" TEXT,
    "weekdayCycle" TEXT,
    "weekNumber" INTEGER,
    "holyDayOfObligation" BOOLEAN NOT NULL DEFAULT false,
    "readings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liturgical_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "liturgical_day_date_unique" ON "liturgical_days"("date");

-- CreateIndex
CREATE UNIQUE INDEX "liturgical_days_date_key" ON "liturgical_days"("date");
