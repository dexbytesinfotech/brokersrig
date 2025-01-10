// import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { create, decode, verify } from "https://deno.land/x/djwt/mod.ts";
const _jwtSecretKey = Deno.env.get('JWT_SECRET_KEY'); ///broker_bud_dydexbyte

// Convert the secret key to a CryptoKey
const key = await crypto.subtle.importKey(
  "raw",                             // Key format
  new TextEncoder().encode(_jwtSecretKey), // Key data
  { name: "HMAC", hash: "SHA-256" },  // Algorithm and hash
  false,                             // Extractable
  ["sign", "verify"]                 // Usages
);

// Example function to create a custom JWT
export async function createCustomJWT(userData) {
  try {
  
// Set expiration time (e.g., token expires in 1 hour)
const hours = 168;
const second = 60;  // 60 = 1 minutes
const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + (60*(second*hours)); // Current time + 3600 seconds (1 hour)
    // // Construct the payload
    const payload = {
      'id': userData.id,
      'email': userData.email,
      'name': userData.first_name,  // Ensure this exists in userData
      'exp': expirationTimeInSeconds, // Token expiration: 1 hour
    };
    // Construct the header
    const header = { alg: "HS256", typ: "JWT" };
    console.log("JWT Token: payload", payload);
    // Create the JWT
const token = await create(
  header, // Header
  payload,// Payload
  key // Key
);
    // const token = encodePayloadToBase64(payload);
    console.log("JWT Token:", token);
    return token;
  } catch (err) {
    console.error('Error creating custom JWT:', err);
    // return err;
    throw new Error(err);
  }
}

export async function verifyJWT(token){
    try {

    if(token===null){
      return null;
    }
    // const payload =  decodeBase64ToPayload(token);

// Verify the token
var verifiedPayload;
try {
  verifiedPayload = await verify(token, key, "HS256"); // Specify algorithm
  console.log("Verified Payload:", verifiedPayload);
} 
catch (err) {
  console.error("JWT Verification Failed:", err.message);
  return null;
}
// Optionally decode the token without verifying (useful for inspecting)
const payload = decode(token);
console.log("Decoded Token:", payload);
    console.log("JWT payload > > > :", payload);
    return verifiedPayload;
    } 
    catch (err) {
      console.error('JWT verification failed:', err);
    //   throw new Error('Invalid token');
    return null;
    }
  }

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
