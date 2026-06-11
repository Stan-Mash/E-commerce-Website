-- Visual search: pgvector embeddings on product images (Jina CLIP v2, 1024 dims).
-- Safe to run multiple times.

create extension if not exists vector;

alter table product_images add column if not exists embedding vector(1024);

-- HNSW index for fast cosine nearest-neighbour search.
do $$ begin
  if not exists (select 1 from pg_indexes where indexname = 'product_images_embedding_idx') then
    create index product_images_embedding_idx on product_images
      using hnsw (embedding vector_cosine_ops);
  end if;
end $$;

-- Best-matching products for a query embedding (lowest cosine distance per product).
create or replace function match_products_by_embedding(
  p_embedding vector(1024),
  p_count     integer default 24
)
returns table (product_id uuid, distance double precision)
language sql
security definer
as $$
  select pi.product_id, min(pi.embedding <=> p_embedding)::double precision as distance
  from product_images pi
  join products p on p.id = pi.product_id
  where pi.embedding is not null
    and p.status in ('active', 'coming_soon')
  group by pi.product_id
  order by distance
  limit p_count;
$$;
