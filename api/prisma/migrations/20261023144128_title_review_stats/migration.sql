-- AlterTable
ALTER TABLE "title" ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "ratingSum" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "title" t
SET "ratingSum" = s."sum",
    "reviewCount" = s."count",
    "averageRating" = s."sum"::DOUBLE PRECISION / s."count"
FROM (
    SELECT "titleId", SUM("score")::INTEGER AS "sum", COUNT(*)::INTEGER AS "count"
    FROM "review"
    GROUP BY "titleId"
) s
WHERE s."titleId" = t."id";
