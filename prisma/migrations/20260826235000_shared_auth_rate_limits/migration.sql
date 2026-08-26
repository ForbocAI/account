CREATE TABLE "auth_rate_limit_buckets" (
    "key_hash" TEXT NOT NULL,
    "request_count" INTEGER NOT NULL,
    "window_started_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_rate_limit_buckets_pkey" PRIMARY KEY ("key_hash")
);

CREATE INDEX "auth_rate_limit_buckets_expires_at_idx"
    ON "auth_rate_limit_buckets"("expires_at");
