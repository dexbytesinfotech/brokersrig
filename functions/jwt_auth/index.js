import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

// Example function to create a custom JWT
export async function createCustomJWT(userData) {
  try {
    // // Your secret key (use a secure key in production)
    const secretKey = 'BzR7D+QXdrXYeDtncd9h8wQp8UpVsOObBlrfq1Gctv+Yw3Hj2FVGVqgE4S04qZPr2qA9RUUpuXr+dmDRMztPA3gBz8yI6ct7Zp0eLw==';
    // // Construct the payload
    const payload = {
      'id': userData.id,
      'email': userData.email,
      'name': userData.first_name,  // Ensure this exists in userData
      'exp': getNumericDate(60 * 60), // Token expiration: 1 hour
    };
    // Construct the header
    const header = {
      alg: "HS512", // Algorithm used for signing
      typ: "JWT",   // Type of token (JWT)
    };
    console.log("JWT Token: payload", payload);
    // Create the JWT
    // const token1 = await create(header, payload, secretKey);
    const token = encodePayloadToBase64(payload);
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