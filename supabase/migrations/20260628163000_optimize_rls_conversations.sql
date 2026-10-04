-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON public.messages;

-- Recreate policies using standard auth.uid() directly
CREATE POLICY "Users can manage their own conversations"
    ON public.conversations FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in their conversations"
    ON public.messages FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()
        )
    );
