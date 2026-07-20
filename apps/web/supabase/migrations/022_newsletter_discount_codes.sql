-- Newsletter signup incentive: a single-use 10%-off promo code issued per
-- subscriber, backed by the existing promotions engine (008_promotions.sql).

alter table newsletter_subscribers add column if not exists discount_code text;
