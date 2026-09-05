-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('FLIGHT', 'TRAIN', 'CAR', 'BUS');

-- CreateEnum
CREATE TYPE "RequestKind" AS ENUM ('RETRIEVAL', 'SHOPPING', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('HANDOFF', 'POSTAL', 'EITHER');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "dealId" TEXT;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'EITHER',
ADD COLUMN     "fromCity" TEXT,
ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "itemValueCents" INTEGER,
ADD COLUMN     "kind" "RequestKind" NOT NULL DEFAULT 'TRANSPORT',
ADD COLUMN     "rewardCents" INTEGER,
ADD COLUMN     "toCity" TEXT,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "capacityKg" DOUBLE PRECISION,
ADD COLUMN     "offersPostal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transportMode" "TransportMode" NOT NULL DEFAULT 'FLIGHT';

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "proposedById" TEXT NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'PROPOSED',
    "rewardCents" INTEGER,
    "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'EITHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deal_requesterId_idx" ON "Deal"("requesterId");

-- CreateIndex
CREATE INDEX "Deal_travelerId_idx" ON "Deal"("travelerId");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_requestId_tripId_key" ON "Deal"("requestId", "tripId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_dealId_key" ON "Conversation"("dealId");

-- CreateIndex
CREATE INDEX "Request_isOpen_idx" ON "Request"("isOpen");

-- CreateIndex
CREATE INDEX "Trip_travelDate_idx" ON "Trip"("travelDate");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

