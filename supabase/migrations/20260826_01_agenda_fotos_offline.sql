begin;

create table if not exists public.visita_fotos (
  id uuid primary key,
  visita_id uuid not null references public.visitas(id) on delete cascade,
  storage_path text not null unique,
  nome_arquivo text not null,
  mime_type text not null,
  tamanho bigint not null check (tamanho > 0),
  criado_por uuid not null references auth.users(id),
  criado_em timestamptz not null default now()
);

create index if not exists visita_fotos_visita_idx on public.visita_fotos (visita_id, criado_em);

alter table public.visita_fotos enable row level security;
drop policy if exists visita_fotos_authenticated_select on public.visita_fotos;
drop policy if exists visita_fotos_authenticated_insert on public.visita_fotos;
drop policy if exists visita_fotos_authenticated_delete on public.visita_fotos;
create policy visita_fotos_authenticated_select on public.visita_fotos for select to authenticated using (true);
create policy visita_fotos_authenticated_insert on public.visita_fotos for insert to authenticated with check (criado_por = auth.uid());
create policy visita_fotos_authenticated_delete on public.visita_fotos for delete to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('visita-fotos', 'visita-fotos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists visita_fotos_storage_select on storage.objects;
drop policy if exists visita_fotos_storage_insert on storage.objects;
drop policy if exists visita_fotos_storage_delete on storage.objects;
create policy visita_fotos_storage_select on storage.objects for select to authenticated using (bucket_id = 'visita-fotos');
create policy visita_fotos_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'visita-fotos');
create policy visita_fotos_storage_delete on storage.objects for delete to authenticated using (bucket_id = 'visita-fotos');

commit;
