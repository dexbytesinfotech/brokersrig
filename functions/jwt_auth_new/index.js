// import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

// index.js
import { create, decode, verify } from "https://deno.land/x/djwt/mod.ts";



// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _jwtSecretKey = Deno.env.get('JWT_SECRET_KEY'); ///broker_bud_dydexbytes
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

serve(async (req) => {
return await createCustomJWT(req);
});

// Example function to create a custom JWT
 async function createCustomJWT(req) {
  try {
console.log(_supabaseUrl);
console.log(_supabaseAnonKey);
console.log(_jwtSecretKey);

// Convert the secret key to a CryptoKey
const key = await crypto.subtle.importKey(
    "raw",                             // Key format
    new TextEncoder().encode(_jwtSecretKey), // Key data
    { name: "HMAC", hash: "SHA-256" },  // Algorithm and hash
    false,                             // Extractable
    ["sign", "verify"]                 // Usages
);
const payload = { foo: "bar" };
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

export async function verifyJWT(token){
    try {
    // const secretKey = 'b3f3f1e9b2cd32f4b7f03cfa0980766f4650e17c7b763d6ac7e0b1b7b8b7f394'; 
    // const payload = await verify(token, secretKey, "HS256");
    if(token===null){
      return null;
    }
    const payload =  decodeBase64ToPayload(token);
    console.log("JWT payload > > > :", payload);
    return payload;
    } 
    catch (err) {
      console.error('JWT verification failed:', err);
    //   throw new Error('Invalid token');
    return null;
    }
  }

//   function generateRandomKey() {
//     const array = new Uint8Array(32); // 32 bytes = 256 bits
//     window.crypto.getRandomValues(array);
//     return Array.from(array).map(byte => byte.toString(16).padStart(2, '0')).join('');
//   }

  // Function to encode the payload to Base64
 function encodePayloadToBase64(payload){
    const jsonPayload = JSON.stringify(payload); // Convert payload to JSON string
    const encoder = new TextEncoder(); // Create a TextEncoder
    const encodedPayload = encoder.encode(jsonPayload); // Encode to Uint8Array
    return btoa(String.fromCharCode(...encodedPayload)); // Convert Uint8Array to Base64
  }

  function decodeBase64ToPayload(encodedPayload) {
    // Decode the Base64 string to a binary string
    const binaryString = atob(encodedPayload);
    // Convert the binary string to a Uint8Array
    const binaryArray = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
    // Decode the Uint8Array back to a JSON string
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(binaryArray);
    // Parse the JSON string back to the original object
    return JSON.parse(jsonString);
  }
    
// Function to generate custom JWT with additional claims
// export async function createCustomJWT(userData) {
//   try {
//     const payload = {
//       id: userData.id,
//       email: userData.email,
//     //   first_name: userData.first_name,
//     //   last_name: userData.last_name,
//       exp: getNumericDate(60 * 60), // Token expiration: 1 hour
//     };

//     const header = {
//       alg: "HS256",
//       typ: "JWT",
//     };

//     // Generate the JWT
//     const token = await create({ alg: "HS256", typ: "JWT" }, payload, secretKey);
//     return token;
//   } catch (err) {
//     console.error('Error creating custom JWT:', err);
//     throw new Error('Failed to create JWT');
//   }
// }