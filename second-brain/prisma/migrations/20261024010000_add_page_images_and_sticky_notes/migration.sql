CREATE TABLE "PageImage" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "content_type" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StickyNote" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StickyNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageImage_page_id_idx" ON "PageImage"("page_id");
CREATE INDEX "StickyNote_page_id_idx" ON "StickyNote"("page_id");

ALTER TABLE "PageImage"
ADD CONSTRAINT "PageImage_page_id_fkey"
FOREIGN KEY ("page_id") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "PageImage_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StickyNote"
ADD CONSTRAINT "StickyNote_page_id_fkey"
FOREIGN KEY ("page_id") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "StickyNote_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
