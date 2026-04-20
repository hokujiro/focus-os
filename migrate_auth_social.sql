-- FOCUS OS: AUTH & SOCIAL MIGRATION (Passwords & Friend Requests)
-- Run this in the Supabase SQL Editor

-- 1. Add password_hash to users table (if public.users exists)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Add status to friendships table
-- 'pending' | 'accepted'
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted';

-- Set existing friendships to 'accepted' just in case. Future requests will be 'pending'.
UPDATE public.friendships SET status = 'accepted' WHERE status IS NULL;
