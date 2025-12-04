// INSTRUÇÕES: Substitua as linhas 237-245 do backend/server.cjs com este código

// Update Usage (CRITICAL: Must increment for plan limits)
if (!hasUnlimitedGeneration) {
    console.log('📊 Updating usage counter for user:', user.id);

    const { data: usageData, error: fetchError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error fetching usage:', fetchError);
        throw new Error('Falha ao verificar uso atual');
    }

    if (usageData) {
        console.log(`📈 Current usage: ${usageData.images_generated}, incrementing to ${usageData.images_generated + 1}`);
        const { error: updateError } = await supabase
            .from('user_usage')
            .update({
                images_generated: usageData.images_generated + 1,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (updateError) {
            console.error('❌ Error updating usage:', updateError);
            throw new Error('Falha ao atualizar contador de uso');
        }
        console.log('✅ Usage updated successfully to:', usageData.images_generated + 1);
    } else {
        console.log('📝 Creating new usage record with count: 1');
        const { error: insertError } = await supabase
            .from('user_usage')
            .insert({
                user_id: user.id,
                images_generated: 1,
                cycle_start_date: new Date().toISOString()
            });

        if (insertError) {
            console.error('❌ Error creating usage record:', insertError);
            throw new Error('Falha ao criar registro de uso');
        }
        console.log('✅ Usage record created successfully');
    }
} else {
    console.log('✨ Unlimited user - skipping usage update');
}
