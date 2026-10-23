ALTER TABLE "Page"
ADD COLUMN "created_by_id" INTEGER,
ADD COLUMN "updated_by_id" INTEGER;

CREATE TABLE "WorkspaceMember" (
    "workspace_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("workspace_id", "user_id")
);

CREATE INDEX "WorkspaceMember_user_id_idx" ON "WorkspaceMember"("user_id");

CREATE TABLE "WorkspaceInvite" (
    "workspace_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("workspace_id")
);

CREATE UNIQUE INDEX "WorkspaceInvite_token_hash_key" ON "WorkspaceInvite"("token_hash");

ALTER TABLE "WorkspaceMember"
ADD CONSTRAINT "WorkspaceMember_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "WorkspaceMember_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceInvite"
ADD CONSTRAINT "WorkspaceInvite_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Page"
ADD CONSTRAINT "Page_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "Page_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
