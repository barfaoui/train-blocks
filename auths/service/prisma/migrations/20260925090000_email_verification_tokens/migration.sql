-- CreateTable
CREATE TABLE "auth"."email_verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "auth"."email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_idx" ON "auth"."email_verification_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "auth"."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
