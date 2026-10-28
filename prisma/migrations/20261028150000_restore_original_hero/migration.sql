-- Restore the original first slide after the broken admin replacement.
-- Scope to the exact broken upload observed on production: do not touch any
-- later replacement made by an administrator before this migration runs.
UPDATE "Banner"
SET "image" = NULL, "active" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "type" = 'HERO' AND "sortOrder" = 0
  AND "image" = '/uploads/1793195860900-a7d749f2-c656-4eb3-9947-1c360a87f7ec.png';
