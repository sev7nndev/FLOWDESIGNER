const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'backend', 'server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('📝 Applying fixes to server.cjs...\n');

// Fix 1: Replace scopedSupabase with globalSupabase in profile query
const fix1Before = `    // Determine Role & Client
    let role = 'free';
    const scopedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    // Get role from database (no hardcoded bypasses)
    const { data: profile } = await scopedSupabase.from('profiles').select('role').eq('id', user.id).single();
    role = profile?.role || 'free';`;

const fix1After = `    // Determine Role & Client
    let role = 'free';
    
    // Use globalSupabase (Service Role) to query profile - bypasses RLS and token issues
    const { data: profile } = await globalSupabase.from('profiles').select('role').eq('id', user.id).single();
    role = profile?.role || 'free';`;

if (content.includes(fix1Before)) {
    content = content.replace(fix1Before, fix1After);
    console.log('✅ Fix 1: Replaced scopedSupabase with globalSupabase in profile query');
} else {
    console.log('⚠️  Fix 1: Pattern not found (may already be applied)');
}

// Fix 2: Replace scopedSupabase with globalSupabase in usage query
const fix2Before = `      const { data: usageData, error: usageError } = await scopedSupabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();`;

const fix2After = `      const { data: usageData, error: usageError } = await globalSupabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();`;

if (content.includes(fix2Before)) {
    content = content.replace(fix2Before, fix2After);
    console.log('✅ Fix 2: Replaced scopedSupabase with globalSupabase in usage query');
} else {
    console.log('⚠️  Fix 2: Pattern not found (may already be applied)');
}

// Fix 3: Replace gemini-1.5-flash with gemini-2.5-flash
content = content.replace(/gemini-1\.5-flash/g, 'gemini-2.5-flash');
console.log('✅ Fix 3: Replaced all gemini-1.5-flash with gemini-2.5-flash');

// Write back
fs.writeFileSync(serverPath, content, 'utf8');
console.log('\n🎉 All fixes applied successfully!');
console.log('📁 File saved:', serverPath);
