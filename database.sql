-- ==============================================================================
-- BUSINESS AI PLATFORM - TO'LIQ SUPABASE DATABASE SKRIPTI
-- Fayl nomi: database.sql
-- Maqsad: Ushbu skript loyihangizning barcha jadvallari, RLS xavfsizlik qoidalari,
--         indekslar, triggerlar, saqlangan funksiyalar (RPC), Storage sozlamalari
--         va boshlang'ich ma'lumotlarini (Seed data) yaratadi.
-- ==============================================================================

-- 1. KERAKLI EXTENSIONLARNI YOQISH
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. JADVALLARNI YARATISH (TABLES)
-- ==============================================================================

-- 2.1. PROFILES JADVALI (Foydalanuvchilar profili)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'Foydalanuvchi',
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2. SUBSCRIPTIONS JADVALI (Obunalar va Limitlar)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL DEFAULT 'Free',
    status TEXT NOT NULL DEFAULT 'active',
    generations_used INTEGER NOT NULL DEFAULT 0,
    generations_limit INTEGER NOT NULL DEFAULT 20,
    paddle_customer_id TEXT,
    paddle_subscription_id TEXT,
    paddle_price_id TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3. USER_AGENT_PROFILE JADVALI (AI Chatbot bilan o'zaro tajriba statistikasi)
CREATE TABLE IF NOT EXISTS public.user_agent_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    total_likes INTEGER NOT NULL DEFAULT 0,
    total_dislikes INTEGER NOT NULL DEFAULT 0,
    like_streak INTEGER NOT NULL DEFAULT 0,
    dislike_streak INTEGER NOT NULL DEFAULT 0,
    idea_heavy_dislikes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4. COLLABORATIONS JADVALI (Hamkorlik loyihalari)
CREATE TABLE IF NOT EXISTS public.collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Jarayonda', -- 'Jarayonda', 'Tekshirilmoqda', 'Yakunlangan'
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
    team JSONB NOT NULL DEFAULT '[]'::jsonb, -- jamoa a'zolari rasmlari arrayi
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5. DISCOVER_ITEMS JADVALI (Discover sahifasidagi ijod namunalari)
CREATE TABLE IF NOT EXISTS public.discover_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL, -- 'E-commerce', 'Interyer', 'Moda', 'Brending', 'Product', 'Social Media'
    likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
    image TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.6. AI_CREATIONS JADVALI (AI Studio / Create sahifasida yaratilgan dizaynlar)
CREATE TABLE IF NOT EXISTS public.ai_creations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    style TEXT,
    ratio TEXT,
    image_url TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7. GENERATIONS JADVALI (Write Ideas / Biznes g'oyalar tahlillari)
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    prompt TEXT NOT NULL,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    result JSONB, -- to'liq tahlil ma'lumotlari (pros, cons, metrics, potential va hk.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.8. CHAT_CONVERSATIONS JADVALI (AI Chat suhbatlari)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    preview TEXT,
    mode TEXT NOT NULL DEFAULT 'general', -- 'general', 'math', 'code', 'science', 'business'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.9. CHAT_MESSAGES JADVALI (AI Chat xabarlari)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    steps JSONB DEFAULT '[]'::jsonb,
    insights JSONB DEFAULT '[]'::jsonb,
    sources JSONB DEFAULT '[]'::jsonb,
    suggested_questions JSONB DEFAULT '[]'::jsonb,
    provider TEXT, -- 'gemini', 'openrouter', 'mistral'
    reaction TEXT CHECK (reaction IN ('like', 'dislike') OR reaction IS NULL),
    is_complete BOOLEAN NOT NULL DEFAULT true,
    mode TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. INDEKSLAR (DATABASE UNUMDORLIGI VA TEZLIGINI OSHIRISH UCHUN)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agent_profile_user_id ON public.user_agent_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON public.collaborations(status);
CREATE INDEX IF NOT EXISTS idx_collaborations_updated_at ON public.collaborations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_discover_items_category ON public.discover_items(category);
CREATE INDEX IF NOT EXISTS idx_discover_items_created_at ON public.discover_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_creations_user_id ON public.ai_creations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_creations_is_public ON public.ai_creations(is_public);
CREATE INDEX IF NOT EXISTS idx_ai_creations_created_at ON public.ai_creations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);

-- ==============================================================================
-- 4. FUNKSIYALAR VA TRIGGERLAR (AUTOMATION)
-- ==============================================================================

-- 4.1. UPDATED_AT USTUNINI AVTOMATIK YANGILOVCHI FUNKSIYA
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at triggerlarini bog'lash
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_agent_profile_updated_at ON public.user_agent_profile;
CREATE TRIGGER set_user_agent_profile_updated_at
    BEFORE UPDATE ON public.user_agent_profile
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_collaborations_updated_at ON public.collaborations;
CREATE TRIGGER set_collaborations_updated_at
    BEFORE UPDATE ON public.collaborations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_discover_items_updated_at ON public.discover_items;
CREATE TRIGGER set_discover_items_updated_at
    BEFORE UPDATE ON public.discover_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_ai_creations_updated_at ON public.ai_creations;
CREATE TRIGGER set_ai_creations_updated_at
    BEFORE UPDATE ON public.ai_creations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_generations_updated_at ON public.generations;
CREATE TRIGGER set_generations_updated_at
    BEFORE UPDATE ON public.generations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER set_chat_conversations_updated_at
    BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 4.2. YANGI FOYDALANUVCHI RO'YXATDAN O'TGANDA PROFIL VA OBUNANI AVTOMATIK YARATISH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Profiles jadvaliga yozish
    INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Foydalanuvchi'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        'Foydalanuvchi'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

    -- 2. Boshlang'ich Free obunasini ochish
    INSERT INTO public.subscriptions (user_id, plan_name, status, generations_limit, generations_used)
    VALUES (NEW.id, 'Free', 'active', 20, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. AI Agent profilini ochish
    INSERT INTO public.user_agent_profile (user_id, total_likes, total_dislikes, like_streak, dislike_streak, idea_heavy_dislikes)
    VALUES (NEW.id, 0, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth triggeri
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4.3. CHATBOT LIKE / DISLIKE REAKSIYASINI SAQLASH RPC FUNKSIYASI (record_feedback)
CREATE OR REPLACE FUNCTION public.record_feedback(
    p_message_id UUID,
    p_reaction TEXT,
    p_is_idea_heavy BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_old_reaction TEXT;
BEGIN
    -- Xabarni va uning egasini aniqlaymiz
    SELECT cm.reaction, cc.user_id INTO v_old_reaction, v_user_id
    FROM public.chat_messages cm
    JOIN public.chat_conversations cc ON cc.id = cm.conversation_id
    WHERE cm.id = p_message_id;

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Xabardagi reaksiyani yangilaymiz
    UPDATE public.chat_messages
    SET reaction = p_reaction
    WHERE id = p_message_id;

    -- Foydalanuvchining agent profilini tekshiramiz/yaratamiz
    INSERT INTO public.user_agent_profile (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Statistikani yangilaymiz
    IF p_reaction = 'like' THEN
        UPDATE public.user_agent_profile
        SET
            total_likes = total_likes + 1,
            total_dislikes = CASE WHEN v_old_reaction = 'dislike' AND total_dislikes > 0 THEN total_dislikes - 1 ELSE total_dislikes END,
            like_streak = like_streak + 1,
            dislike_streak = 0
        WHERE user_id = v_user_id;
    ELSIF p_reaction = 'dislike' THEN
        UPDATE public.user_agent_profile
        SET
            total_dislikes = total_dislikes + 1,
            total_likes = CASE WHEN v_old_reaction = 'like' AND total_likes > 0 THEN total_likes - 1 ELSE total_likes END,
            dislike_streak = dislike_streak + 1,
            like_streak = 0,
            idea_heavy_dislikes = CASE WHEN p_is_idea_heavy THEN idea_heavy_dislikes + 1 ELSE idea_heavy_dislikes END
        WHERE user_id = v_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4.4. CHATBOT REAKSIYASINI O'CHIRISH RPC FUNKSIYASI (remove_feedback)
CREATE OR REPLACE FUNCTION public.remove_feedback(
    p_message_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_old_reaction TEXT;
BEGIN
    SELECT cm.reaction, cc.user_id INTO v_old_reaction, v_user_id
    FROM public.chat_messages cm
    JOIN public.chat_conversations cc ON cc.id = cm.conversation_id
    WHERE cm.id = p_message_id;

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE public.chat_messages
    SET reaction = NULL
    WHERE id = p_message_id;

    IF v_old_reaction = 'like' THEN
        UPDATE public.user_agent_profile
        SET total_likes = GREATEST(0, total_likes - 1),
            like_streak = 0
        WHERE user_id = v_user_id;
    ELSIF v_old_reaction = 'dislike' THEN
        UPDATE public.user_agent_profile
        SET total_dislikes = GREATEST(0, total_dislikes - 1),
            dislike_streak = 0
        WHERE user_id = v_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - XAVFSIZLIK VA RUXSATLAR
-- ==============================================================================

-- Barcha jadvallarda RLS ni yoqish
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agent_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discover_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 5.1. PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- 5.2. SUBSCRIPTIONS POLICIES
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription"
    ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- 5.3. USER_AGENT_PROFILE POLICIES
DROP POLICY IF EXISTS "Users can view own agent profile" ON public.user_agent_profile;
CREATE POLICY "Users can view own agent profile"
    ON public.user_agent_profile FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own agent profile" ON public.user_agent_profile;
CREATE POLICY "Users can insert own agent profile"
    ON public.user_agent_profile FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agent profile" ON public.user_agent_profile;
CREATE POLICY "Users can update own agent profile"
    ON public.user_agent_profile FOR UPDATE
    USING (auth.uid() = user_id);

-- 5.4. COLLABORATIONS POLICIES
DROP POLICY IF EXISTS "Anyone can view collaborations" ON public.collaborations;
CREATE POLICY "Anyone can view collaborations"
    ON public.collaborations FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create collaborations" ON public.collaborations;
CREATE POLICY "Authenticated users can create collaborations"
    ON public.collaborations FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update collaborations" ON public.collaborations;
CREATE POLICY "Authenticated users can update collaborations"
    ON public.collaborations FOR UPDATE
    USING (true);

-- 5.5. DISCOVER_ITEMS POLICIES
DROP POLICY IF EXISTS "Anyone can view discover items" ON public.discover_items;
CREATE POLICY "Anyone can view discover items"
    ON public.discover_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can like discover items" ON public.discover_items;
CREATE POLICY "Anyone can like discover items"
    ON public.discover_items FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create discover items" ON public.discover_items;
CREATE POLICY "Authenticated users can create discover items"
    ON public.discover_items FOR INSERT
    WITH CHECK (true);

-- 5.6. AI_CREATIONS POLICIES
DROP POLICY IF EXISTS "Users can view public designs or their own" ON public.ai_creations;
CREATE POLICY "Users can view public designs or their own"
    ON public.ai_creations FOR SELECT
    USING (is_public = true OR auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Anyone can create designs" ON public.ai_creations;
CREATE POLICY "Anyone can create designs"
    ON public.ai_creations FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own designs" ON public.ai_creations;
CREATE POLICY "Users can update their own designs"
    ON public.ai_creations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own designs" ON public.ai_creations;
CREATE POLICY "Users can delete their own designs"
    ON public.ai_creations FOR DELETE
    USING (auth.uid() = user_id);

-- 5.7. GENERATIONS POLICIES (Write Ideas)
DROP POLICY IF EXISTS "Users can view own idea generations" ON public.generations;
CREATE POLICY "Users can view own idea generations"
    ON public.generations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own idea generations" ON public.generations;
CREATE POLICY "Users can insert own idea generations"
    ON public.generations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own idea generations" ON public.generations;
CREATE POLICY "Users can update own idea generations"
    ON public.generations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own idea generations" ON public.generations;
CREATE POLICY "Users can delete own idea generations"
    ON public.generations FOR DELETE
    USING (auth.uid() = user_id);

-- 5.8. CHAT_CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chat_conversations;
CREATE POLICY "Users can view own conversations"
    ON public.chat_conversations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own conversations" ON public.chat_conversations;
CREATE POLICY "Users can create own conversations"
    ON public.chat_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;
CREATE POLICY "Users can update own conversations"
    ON public.chat_conversations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.chat_conversations;
CREATE POLICY "Users can delete own conversations"
    ON public.chat_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- 5.9. CHAT_MESSAGES POLICIES
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages in own conversations"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE public.chat_conversations.id = public.chat_messages.conversation_id
            AND public.chat_conversations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages into own conversations" ON public.chat_messages;
CREATE POLICY "Users can insert messages into own conversations"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE public.chat_conversations.id = public.chat_messages.conversation_id
            AND public.chat_conversations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update messages in own conversations" ON public.chat_messages;
CREATE POLICY "Users can update messages in own conversations"
    ON public.chat_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE public.chat_conversations.id = public.chat_messages.conversation_id
            AND public.chat_conversations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON public.chat_messages;
CREATE POLICY "Users can delete messages in own conversations"
    ON public.chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_conversations
            WHERE public.chat_conversations.id = public.chat_messages.conversation_id
            AND public.chat_conversations.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 6. STORAGE BUCKET: AVATARS (PROFIL RASMLARI UCHUN)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage obyektlari xavfsizlik qoidalari
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update their avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update their avatars"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete their avatars" ON storage.objects;
CREATE POLICY "Authenticated users can delete their avatars"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ==============================================================================
-- 7. BOSHLANG'ICH MA'LUMOTLAR (SEED INITIAL DATA)
-- Discover va Hamkorlik bo'limlari darhol to'liq va chiroyli ishlashi uchun
-- ==============================================================================

-- 7.1. Discover bo'limi uchun namunalar
INSERT INTO public.discover_items (title, author, category, likes, image)
SELECT * FROM (VALUES
    ('Minimalist Qahva Paketi Dizayni', 'Azizbek Rahimov', 'E-commerce', 142, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80'),
    ('Zamonaviy Yashash Xonasi Interyeri', 'Madina Karimova', 'Interyer', 98, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80'),
    ('Kuzgi Moda Kolleksiyasi 2026', 'Jasur Aliyev', 'Moda', 230, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80'),
    ('Fintech Ilovasi Brending Konsepsiyasi', 'Sardor Usmonov', 'Brending', 185, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'),
    ('Simsiz Quloqchinlar 3D Renderi', 'Bobur Mirzayev', 'Product', 76, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'),
    ('Instagram Stories Reklama Shablonlari', 'Nilufar Saidova', 'Social Media', 312, 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80'),
    ('Organik Kosmetika Mahsulot Qutisi', 'Kamola Yusupova', 'E-commerce', 119, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80'),
    ('Skandinaviya Uslubidagi Oshxona', 'Temur Davronov', 'Interyer', 164, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80')
) AS v(title, author, category, likes, image)
WHERE NOT EXISTS (SELECT 1 FROM public.discover_items LIMIT 1);

-- 7.2. Hamkorlik bo'limi uchun namunalar
INSERT INTO public.collaborations (title, description, status, progress, comments_count, team)
SELECT * FROM (VALUES
    (
        'E-commerce AI Dizayn Generator',
        'Onlayn do''konlar uchun mahsulot rasmlaridan avtomatik banner va reklama postlari yaratuvchi vosita.',
        'Jarayonda',
        65,
        14,
        '["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"]'::jsonb
    ),
    (
        'Brending Identiteti Shablonlari',
        'Startaplar uchun logotip, ranglar palitrasi va korporativ uslubni avtomatlashtirish moduli.',
        'Tekshirilmoqda',
        90,
        8,
        '["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"]'::jsonb
    ),
    (
        'Social Media Video va Karusel Generator',
        'Instagram va TikTok uchun avtomatlashtirilgan kontent rejalashtirish tizimi integratsiyasi.',
        'Yakunlangan',
        100,
        22,
        '["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop"]'::jsonb
    )
) AS v(title, description, status, progress, comments_count, team)
WHERE NOT EXISTS (SELECT 1 FROM public.collaborations LIMIT 1);
