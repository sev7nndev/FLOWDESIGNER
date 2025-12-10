const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'backend', 'server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('🔧 Replacing ALL scopedSupabase with globalSupabase...\n');

// Count occurrences
const count = (content.match(/scopedSupabase/g) || []).length;
console.log(`Found ${count} occurrences of scopedSupabase`);

// Replace ALL scopedSupabase with globalSupabase
content = content.replace(/scopedSupabase/g, 'globalSupabase');

// Remove the scopedSupabase creation lines (they're now unused)
content = content.replace(/\s*const scopedSupabase = createClient\(SUPABASE_URL, SUPABASE_ANON_KEY, \{\s*global: \{ headers: \{ Authorization: req\.headers\.authorization \} \}\s*\}\);/g, '');

// Write back
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`\n✅ Replaced ${count} occurrences`);
console.log('✅ Removed scopedSupabase creation lines');
console.log('🎉 All fixes applied!');
