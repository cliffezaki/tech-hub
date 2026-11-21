-- Run once in a NEW staging Supabase project's SQL editor.
-- All private CMS records are accessible only to the website server.
begin;

create table public.cms_records (
    collection text not null check (collection ~ '^[a-zA-Z0-9_-]+$'),
    id text not null check (id ~ '^[a-zA-Z0-9_-]+$'),
    payload jsonb not null,
    primary key (collection, id)
);

alter table public.cms_records enable row level security;
alter table public.cms_records force row level security;
revoke all on table public.cms_records from public, anon, authenticated;
grant select, insert, update, delete on table public.cms_records to service_role;
-- No browser policies: sign-ins use the website's existing server authorization.

notify pgrst, 'reload schema';
commit;
