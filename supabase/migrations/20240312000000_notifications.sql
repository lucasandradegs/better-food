-- Drop existing objects if they exist
drop trigger if exists handle_updated_at on notifications;
drop function if exists moddatetime();
drop function if exists public.get_unread_notifications_count(uuid);
drop table if exists public.notifications;
drop type if exists public.notification_status;

-- Cria a função moddatetime
create or replace function moddatetime()
returns trigger as $$
begin
    new.updated_at = current_timestamp;
    return new;
end;
$$ language plpgsql;

create type public.notification_status as enum ('read', 'unread');

create table public.notifications (
    id uuid not null default uuid_generate_v4() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    description text not null,
    status notification_status not null default 'unread',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita o RLS (Row Level Security)
alter table public.notifications enable row level security;

-- Cria política para permitir usuários verem apenas suas próprias notificações
create policy "Users can view own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

-- Cria política para permitir inserção de notificações (pode ser restrito depois se necessário)
create policy "Enable insert for authenticated users only"
    on public.notifications for insert
    with check (auth.role() = 'authenticated');

-- Cria política para permitir usuários atualizarem suas próprias notificações
create policy "Users can update own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);

-- Cria função para contar notificações não lidas
create or replace function public.get_unread_notifications_count(p_user_id uuid)
returns integer as $$
begin
    return (
        select count(*)
        from public.notifications
        where user_id = p_user_id
        and status = 'unread'
    );
end;
$$ language plpgsql security definer;

-- Habilita realtime para a tabela de notificações
alter publication supabase_realtime add table notifications;

-- Trigger para atualizar o updated_at
create trigger handle_updated_at before update on notifications
    for each row execute procedure moddatetime(); 