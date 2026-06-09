--
-- Migration 005: add customer_id to orders
--
-- Currently every order is a "guest checkout" - the order is linked only to a
-- phone number, not to an authenticated user account. When storefront login is
-- added later, checkout/route.ts will inject the authenticated user's ID into
-- the RPC call. Adding the column now (nullable, no default) means that schema
-- change won't require a production migration at launch time.
--
-- The column references auth.users (Supabase's built-in auth table) so that
-- a customer row in your own `customers` table is optional - you can link
-- directly to the Supabase auth identity.
--

alter table orders
  add column if not exists customer_id uuid
    references auth.users(id)
    on delete set null;     -- if an account is deleted the order history is kept

create index if not exists orders_customer_id_idx on orders(customer_id);

comment on column orders.customer_id is
  'Null = guest checkout. Populated when a logged-in customer places an order.';
