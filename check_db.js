const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '.env');

try {
  if (!fs.existsSync(envPath)) {
    console.error("❌ ERROR: .env file does not exist at root of the project!");
    console.log("Please make sure you have a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY.");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });

  const supabaseUrl = env['EXPO_PUBLIC_SUPABASE_URL'];
  const supabaseKey = env['EXPO_PUBLIC_SUPABASE_KEY'] || env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

  console.log("----------------------------------------");
  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Key (masked):", supabaseKey ? supabaseKey.substring(0, 15) + '...' : 'undefined');
  console.log("----------------------------------------");

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR: Missing Supabase credentials in .env file!");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  async function checkConnection() {
    console.log("Connecting to Supabase API...");
    try {
      // Query the 'todos' table
      const { data, error } = await supabase.from('todos').select('*').limit(1);
      
      if (error) {
        console.log("\nResponse received from Supabase!");
        console.log("HTTP Status:", error.status);
        console.log("Postgres Code:", error.code);
        console.log("Message:", error.message);
        
        if (error.code === '42P01') {
          console.log("\n✅ CONNECTION SUCCESSFUL: The API key and network connection are correct!");
          console.log("Note: The 'todos' table does not exist in this database yet (which is expected since we haven't run the migrations).");
        } else if (error.status === 401 || error.status === 403) {
          console.log("\n❌ AUTHENTICATION ERROR: The provided Supabase Key or URL appears to be invalid.");
        } else {
          console.log("\n❌ DATABASE ERROR: Connected but got database error:", error.message);
        }
      } else {
        console.log("\n✅ CONNECTION SUCCESSFUL!");
        console.log("Data fetched from 'todos' table:", data);
      }
    } catch (err) {
      console.error("\n❌ NETWORK ERROR: Failed to reach Supabase server:", err.message);
      console.log("Check your internet connection and the Supabase URL.");
    }
  }

  checkConnection();

} catch (err) {
  console.error("Error running database check:", err.message);
}
