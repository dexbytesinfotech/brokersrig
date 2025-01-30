
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js";
import { returnResponse } from "../response_formatter/index.ts";

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');

const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

serve(async (req) => {
  try {

        // Handle OPTIONS Preflight Request
        if (req.method === "OPTIONS") {
          console.log("called API >>>> OPTIONS in:");
          return new Response(null, {
            status: 204, // No Content response
            headers: {
              "Access-Control-Allow-Origin": "*", // Allow all domains
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          });
        }
    // Extract request body
    const payload = await req.json();
    console.log('Incoming Payload:', payload);
    
    // Extract phone_number from payload
    const { phone_number,otp} = payload; // Ensure the payload has a property named phone_number

    // Check if the phone number exists in the user table
    const { data, error } = await _supabase
      .from('users')
      .select('*')
      .eq('phone_number', phone_number)
      .maybeSingle(); // Use .maybeSingle() if you expect only one result

      console.log('Retrive data:', data);

    if (error) {
      console.error('Error checking phone number:', error);
      return returnResponse(500,`Error checking phone number: ${error.message}`,null);
    }

    // If data is found, phone number exists
    if (data!=null) {
      console.log('Phone number exists:', data);
      console.log('OTP:', otp);
      if(otp=="1234"){
        return returnResponse(200,`Success`,data);
      }
      return returnResponse(201,`Please enter correct OTP`,null); 
    } 
    else {
 // Phone number does not exist
      console.log('User not Exist in db');
      return returnResponse(201,`Number not exist please connect to admin`,null);
    }
    
  } catch (err) {
    console.error('Failed to create OneSignal notification', err);
    return new Response(`Server error: ${err.message}`, {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Function that returns either a string or a number
// function canSendNotification(tableName, eventType) {
//     if (tableName === "intraday_announcement_table" && eventType === "INSERT") {
//         return true;
//     } else if (tableName === "long_term_announcement" && eventType === "INSERT") {
//         return true;
//     }
//     return false;
// }
