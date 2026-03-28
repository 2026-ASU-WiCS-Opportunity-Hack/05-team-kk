-- Create the public assets storage bucket

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files
create policy "assets_insert" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'assets');

-- Allow authenticated users to update their uploads
create policy "assets_update" on storage.objects for update
  to authenticated
  using (bucket_id = 'assets');

-- Allow authenticated users to delete their uploads
create policy "assets_delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'assets');

-- Allow public read access to all assets
create policy "assets_select" on storage.objects for select
  to public
  using (bucket_id = 'assets');
