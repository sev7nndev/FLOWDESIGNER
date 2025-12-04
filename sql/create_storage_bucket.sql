-- Create Storage Bucket for Images
insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', false)
on conflict (id) do nothing;

-- Storage Policies
create policy "Users can upload own images"
on storage.objects for insert
with check ( bucket_id = 'generated-images' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can view own images"
on storage.objects for select
using ( bucket_id = 'generated-images' and auth.uid()::text = (storage.foldername(name))[1] );

-- Allow Admin Access
create policy "Admins can view all images"
on storage.objects for select
using ( bucket_id = 'generated-images' and exists (
  select 1 from public.profiles 
  where profiles.id = auth.uid() 
  and profiles.role in ('owner', 'admin', 'dev')
));
