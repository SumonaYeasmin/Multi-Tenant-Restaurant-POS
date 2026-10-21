-- CreateTable
CREATE TABLE "reservation_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "defaultDurationMin" INTEGER NOT NULL DEFAULT 90,
    "bufferTimeMin" INTEGER NOT NULL DEFAULT 30,
    "earlyArrivalWindowMin" INTEGER NOT NULL DEFAULT 15,
    "noShowGracePeriodMin" INTEGER NOT NULL DEFAULT 15,
    "minPartySize" INTEGER NOT NULL DEFAULT 1,
    "maxPartySize" INTEGER NOT NULL DEFAULT 20,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
    "minAdvanceHours" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservation_settings_tenantId_key" ON "reservation_settings"("tenantId");

-- AddForeignKey
ALTER TABLE "reservation_settings" ADD CONSTRAINT "reservation_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
