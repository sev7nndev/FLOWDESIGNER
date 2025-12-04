const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verify authorization
if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

try {
    console.log('🔄 Starting monthly quota reset...');

    // Call the SQL function
    const { error } = await supabase.rpc('reset_monthly_quota');

    if (error) {
        console.error('❌ Reset error:', error);
        return res.status(500).json({ error: error.message });
    }

    console.log('✅ Monthly quota reset completed successfully');
    return res.status(200).json({
        success: true,
        message: 'Monthly quota reset completed',
        timestamp: new Date().toISOString()
    });

} catch (error) {
    console.error('❌ Cron job error:', error);
    return res.status(500).json({ error: error.message });
}

module.exports = async (req, res) => {
    // Verify authorization
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { createClient } = require('@supabase/supabase-js');

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    try {
        console.log('🔄 Starting monthly quota reset...');

        // Call the SQL function
        const { error } = await supabase.rpc('reset_monthly_quota');

        if (error) {
            console.error('❌ Reset error:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log('✅ Monthly quota reset completed successfully');
        return res.status(200).json({
            success: true,
            message: 'Monthly quota reset completed',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Cron job error:', error);
        return res.status(500).json({ error: error.message });
    }
};
