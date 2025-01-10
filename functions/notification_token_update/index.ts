
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js";
import { returnResponse } from "../response_formatter/index.ts";

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');

const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

serve(async (req) => {
  try {
    // Extract request body
    const payload = await req.json();
    console.log('Incoming Payload:', payload);
    
    // Extract subscription_ids from payload
    const { subscription_ids, user_id } = payload; // Ensure the payload has a property named phone_number

    // Check if the subscription_ids exists in the user table
    const { data, error } = await _supabase
      .from('notifications')
      .select('*')
      .eq('subscription_ids', subscription_ids).maybeSingle(); // Use .single() if you expect only one result

    if (error) {
      console.error('Error checking subscription_ids:', error);
      return new Response(`Error checking subscription_ids: ${error.message}`, {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    // If data is found, subscription_ids exists
    if (data!=null) {
      console.log('subscription_ids exists:', data);
      return returnResponse(200, `Success`, data);;
    } else {
      // subscription_ids does not exist
      console.log('subscription_ids does not exist');
      const { data, error } = await _supabase
      .from('notifications')
      .insert([
        {
          subscription_ids: subscription_ids,  // Insert the phone number
          user_id: user_id           // Insert the user's email
        }
      ]).maybeSingle().select(); // Use .single() if you expect only one result

      if (error) {
        console.error('Error checking subscription_ids:', error);
      return returnResponse(200, `Error checking subscription_ids: ${error.message}`, null);
    
      }

      return returnResponse(200, `Updated successfully`, data);
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
