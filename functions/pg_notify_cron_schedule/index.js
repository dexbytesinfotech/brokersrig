import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import {verifyJWT } from "../jwt_auth/index.js";

import { validateHeaders, getHeaderAuthorization,validateEndPoint,getApiRequest,getMinMaxPriceFromBudgetCode,getPriceFromString,generateUniqueIntId,validateRequredReqFields,getFilteredReqData,formatNumber} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);


const returnFollowUpColumn = ['created_at','assigned_id','follow_up_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time','follow_up_category'].join(', ');

// serve(async (req) => {
//   try {
//          const url = new URL(req.url);
//          console.log("Cron job called API >>>> :", url);
//          return new Response("Listening for cron job notifications!");
//   } 
//   catch (err) {
//     console.error('Cron job called API >>>> : Server error: new', err);
//     return returnResponse(500,`User not exist`,null);
//   }
// });

export async function notifyToAllFollowUps(){
  try
  {
    const notifyBefore = 10;  // in minutes
    const currentTime = Date.now();  // current time in milliseconds
    
    // Calculate the range of time to compare against
    const notifyBeforeMilliseconds = notifyBefore * 60 * 1000;  // convert notifyBefore to milliseconds
    const lowerBound = currentTime - notifyBeforeMilliseconds;  // subtract notifyBefore from current time
    const upperBound = currentTime + notifyBeforeMilliseconds;  // add notifyBefore to current time
    
    const lowerBoundDate = new Date(lowerBound).toISOString();
    const upperBoundDate = new Date(upperBound).toISOString();
 // Fetch data from the 'follow_up' table
const { data, error } = await _supabase
.from('follow_up')
.select(`${returnFollowUpColumn},usersProfile(${['user_id', 'first_name'].join(', ')})`)
.eq('is_deleted', false)
.gte('follow_up_date_time', lowerBoundDate)  // follow_up_date_time >= lowerBound
.lte('follow_up_date_time', upperBoundDate)  // follow_up_date_time <= upperBound

if (error) {
      console.error('Failed:', error);
      return returnResponse(500, `Followup add Failed: ${error.message}`, null);
    }
  // Add lead in user lead refrence table
  if(!(data===null) && (data.length>0)){
    
  }
      
    // Add lead in user lead refrence table
    if(!(data===null) && (data.length>0)){
      return returnResponse(200, 'Success', data);
    }
    return returnResponse(200, `No data found`, null);
  }
  catch (err) {
    return returnResponse(500,`Server side error ${err}`,null);
  }
}