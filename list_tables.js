const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydGJ5a2l6bXZqdXhjeWZ3a3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODcwMzE1MCwiZXhwIjoyMDg0Mjc5MTUwfQ.5OUvu1ewcxBpRu5XeA8Kr68RnL3AGPt6L88nugdKbXo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data, error } = await supabase
        .rpc('get_tables'); // This might not exist, alternative:

    if (error) {
        // Try raw SQL if RPC fails (needs a function defined)
        // Or just query information_schema if we have a way
        console.log('Error listing via RPC, trying direct schema check might require better permissions or a helper function.');
    }

    // Alternative: since we can't do raw SQL easily from JS without a function, 
    // let's just list what's in the schema.sql which is the source of truth.
    console.log('Tablas encontradas en schema.sql:');
}

listTables();
