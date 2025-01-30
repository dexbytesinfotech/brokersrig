// import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

import { create, decode, verify } from "https://deno.land/x/djwt/mod.ts";

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _jwtSecretKey = Deno.env.get('JWT_SECRET_KEY'); ///broker_bud_dydexbytes
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

serve(async (req) => {
      // Handle OPTIONS Preflight Request
      if (req.method === "OPTIONS") {
        console.log("called API >>>> OPTIONS in:", url);
        return new Response(null, {
          status: 204, // No Content response
          headers: {
            "Access-Control-Allow-Origin": "*", // Allow all domains
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      }
return await createCustomJWT(req);
});

// Example function to create a custom JWT
 async function createCustomJWT(req) {
  try {
// Convert the secret key to a CryptoKey
const key = await crypto.subtle.importKey(
    "raw",                             // Key format
    new TextEncoder().encode(_jwtSecretKey), // Key data
    { name: "HMAC", hash: "SHA-256" },  // Algorithm and hash
    false,                             // Extractable
    ["sign", "verify"]                 // Usages
);

// Set expiration time (e.g., token expires in 1 hour)
const hours = 1;
const second = 1;  // 60 = 1 minutes
const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + (60*(second*hours)); // Current time + 3600 seconds (1 hour)

const payload = {
  foo: "bar",    // Custom data
  exp: expirationTimeInSeconds, // Expiration time
};

// Create the JWT
const token = await create(
    { alg: "HS256", typ: "JWT" }, // Header
    payload,                      // Payload
    key                           // Key
);

console.log("Generated Token:", token);
    return returnResponse(200,"Success ",{"token":token});
  } catch (err) {
    console.error('Error creating custom JWT:', err);
    // return err;
    return returnResponse(500,`Error ${err.message}  /n ${_supabaseUrl} == ${_supabaseAnonKey} == ${_jwtSecretKey}`,err);
  }
}
