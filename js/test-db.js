const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ghlvnloxqiocndjhvdfz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobHZubG94cWlvY25kamh2ZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDg2ODYsImV4cCI6MjA5OTUyNDY4Nn0.zNCZRASkd5dzSGnt9J4E_iJf2oF8tpXWbAnMnFPSRjk";

const db = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
    const { data, error } = await db
        .from('games') 
        .insert([
            { id: 0 }
        ])
        .select();

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Row added:", data);
    }
}

testSupabase();