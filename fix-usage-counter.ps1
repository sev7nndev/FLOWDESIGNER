# Script to fix the usage counter in server.cjs
Write-Host "🔧 Fixing usage counter in server.cjs..." -ForegroundColor Yellow

# Read the original file
$content = Get-Content "backend\server.cjs" -Raw

# Define the old code pattern to replace
$oldPattern = @"
    // Update Usage
    if \(\!hasUnlimitedGeneration\) \{
      const \{ data: usageData \} = await supabase\.from\('user_usage'\)\.select\('\*'\)\.eq\('user_id', user\.id\)\.single\(\);
      if \(usageData\) \{
        await supabase\.from\('user_usage'\)\.update\(\{ images_generated: usageData\.images_generated \+ 1 \}\)\.eq\('user_id', user\.id\);
      \} else \{
        await supabase\.from\('user_usage'\)\.insert\(\{ user_id: user\.id, images_generated: 1 \}\);
      \}
    \}
"@

# Define the new code
$newCode = @"
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
        console.log(`📈 Current usage: `${usageData.images_generated}, incrementing to `${usageData.images_generated + 1}`);
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
"@

# Backup original
Copy-Item "backend\server.cjs" "backend\server.cjs.backup" -Force
Write-Host "✅ Backup created: backend\server.cjs.backup" -ForegroundColor Green

# Replace using regex
$newContent = $content -replace $oldPattern, $newCode

# Write the new content
$newContent | Out-File -FilePath "backend\server.cjs" -Encoding utf8 -NoNewline

Write-Host "✅ Usage counter fixed! Restart the backend server." -ForegroundColor Green
Write-Host "   Run: Ctrl+C in the server terminal, then: node backend/server.cjs" -ForegroundColor Cyan
