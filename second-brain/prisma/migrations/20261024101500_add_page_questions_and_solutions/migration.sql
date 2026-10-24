CREATE TABLE "PageQuestion" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "content" VARCHAR(5000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PageSolution" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "content" VARCHAR(5000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageSolution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PageQuestion_page_id_idx" ON "PageQuestion"("page_id");
CREATE INDEX "PageSolution_question_id_idx" ON "PageSolution"("question_id");

ALTER TABLE "PageQuestion" ADD CONSTRAINT "PageQuestion_page_id_fkey"
    FOREIGN KEY ("page_id") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageQuestion" ADD CONSTRAINT "PageQuestion_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageSolution" ADD CONSTRAINT "PageSolution_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "PageQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageSolution" ADD CONSTRAINT "PageSolution_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
