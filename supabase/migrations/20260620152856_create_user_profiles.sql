-- 1. Create a secure internal schema for functions and triggers to avoid public API exposure
CREATE SCHEMA IF NOT EXISTS internal;

-- 2. Define the custom user roles enum
CREATE TYPE public.user_role AS ENUM ('citizen', 'responder', 'admin');

-- 3. Create the user profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    role public.user_role NOT NULL DEFAULT 'citizen',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Enforce alphanumeric constraints (letters, numbers, underscores) and length (3-20 chars)
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
    CONSTRAINT username_alphanumeric CHECK (username ~* '^[a-z0-9_]+$')
);

-- 4. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies
-- Allow anyone (public/anon/authenticated) to read user profile details (useful for chat/reports)
CREATE POLICY "Allow public read access on profiles"
    ON public.profiles FOR SELECT
    USING (true);

-- Allow authenticated users to update their own profile details
CREATE POLICY "Allow owner update access on profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 6. Prevent column-level updates on sensitive columns (e.g. role) by regular users
CREATE OR REPLACE FUNCTION internal.prevent_user_role_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow service_role to update the user's role column to prevent user-driven escalation
    IF NEW.role IS DISTINCT FROM OLD.role AND (auth.role() <> 'service_role' OR auth.role() IS NULL) THEN
        RAISE EXCEPTION 'Access Denied: You are not allowed to modify your user role.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_profile_update_security
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION internal.prevent_user_role_update();

-- 7. Automatically update updated_at timestamp on updates
CREATE OR REPLACE FUNCTION internal.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();

-- 8. Create trigger function to handle profile insertion on new auth user signup
CREATE OR REPLACE FUNCTION internal.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_val TEXT;
BEGIN
    -- Extract username from raw_user_meta_data, fallback to the email prefix if metadata is missing
    username_val := COALESCE(new.raw_user_meta_data->>'username', substring(new.email from '^[^@]+'));
    
    -- Sanitize username: keep only letters, numbers, and underscores to satisfy constraint
    username_val := regexp_replace(username_val, '[^a-zA-Z0-9_]', '', 'g');
    
    -- Ensure fallback has valid length
    IF char_length(username_val) < 3 THEN
        username_val := username_val || '_user';
    END IF;
    IF char_length(username_val) > 20 THEN
        username_val := substring(username_val from 1 for 20);
    END IF;

    -- Insert profile
    INSERT INTO public.profiles (id, username, display_name, role)
    VALUES (
        new.id,
        username_val,
        COALESCE(new.raw_user_meta_data->>'display_name', username_val),
        'citizen' -- Strictly force 'citizen' role on all self-registrations to prevent privilege escalation
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Register the user creation trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION internal.handle_new_user();
