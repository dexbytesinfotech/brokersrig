import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import * as OneSignal from 'https://esm.sh/@onesignal/node-onesignal@1.0.0-beta9';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import {verifyJWT } from "../jwt_auth/index.js";

import { validateHeaders, getHeaderAuthorization,validateEndPoint,getApiRequest,getMinMaxPriceFromBudgetCode,getPriceFromString,generateUniqueIntId,validateRequredReqFields,getFilteredReqData,formatNumber} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

const _OnesignalAppId_ = Deno.env.get('ONESIGNAL_APP_ID');
const _OnesignalRestApiKey_ = Deno.env.get('ONESIGNAL_REST_API_KEY');

// const configuration = OneSignal.createConfiguration({
//   appKey: _OnesignalRestApiKey_,
// });
// const onesignal = new OneSignal.DefaultApi(configuration);


const returnFollowUpColumn = ['notify_status','created_at','assigned_id','follow_up_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time','follow_up_category'].join(', ');

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
.eq('notify_status', false)
.gte('follow_up_date_time', lowerBoundDate)  // follow_up_date_time >= lowerBound
.lte('follow_up_date_time', upperBoundDate)  // follow_up_date_time <= upperBound

if (error) {
      console.error('Failed:', error);
      return returnResponse(500, `Followup add Failed: ${error.message}`, null);
    }
     
    // Add lead in user lead refrence table
    if(!(data===null) && (data.length>0)){
      try{

        const ids = data.map(item => item.assigned_id);
        console.log('Success updatedData ids > > :', ids);

        const result = await notifyToAllIUsers(data);

        // const { data:updatedData, error } = await _supabase
        // .from('follow_up')
        // .update({ notify_status: true })
        // .in('assigned_id',ids) 
        console.log('Success updatedData:', result);
      }
      catch(error)
      {
        console.error('Server side error ', error);
        return returnResponse(500,`Server side error ${error}`,null);
      }
      const result = await notifyToAllIUsers({data:data});
      return returnResponse(200, 'Success >', result);
    }
    console.log('Notification 001 ', "1");
    const result = await notifyToAllIUsers({data:data});
    console.log('Notification 002 ', "2");
    return returnResponse(200, `No data found`, result);
  }
  catch (err) {
    return returnResponse(500,`Server side error ${err}`,null);
  }
}



async function notifyToAllIUsers(record){
  let notificationMsg = getNotificationMsg(1,record);
  let subscriptionIdsArray = ['All'];
// Remove duplicates if necessary
 subscriptionIdsArray = [...new Set(subscriptionIdsArray)];
        // Create and send OneSignal notification
        // const notification = new OneSignal.Notification();
        // console.log('Notification 004', "4");
        // notification.app_id = _OnesignalAppId_;
        // // notification.include_player_ids = subscriptionIdsArray;
        // notification.included_segments = subscriptionIdsArray;
        // console.log('Notification 005', "5");
        // notification.contents = { en: `${notificationMsg.contents}`};
        // notification.headings = { en: `${notificationMsg.headings}` };
        // notification.data = { en: `${notificationMsg.data}` };
        // console.log('Notification 006', "6");
        // const onesignalApiRes = await onesignal.createNotification(notification);
        // console.log('Notification 007', "7");
        // console.log('Notification 008', onesignalApiRes);
        // return onesignalApiRes;


// Function to send notification using OneSignal
const sendNotification = async (subscriptionIdsArray, notificationMsg) => {

  const headers = {
    'Authorization': `Basic ${_OnesignalRestApiKey_}`,
    'Content-Type': 'application/json',
  };
  
  const notificationData = {
    app_id: _OnesignalAppId_,
    contents: { en: `${notificationMsg.contents}` },
    headings: { en: `${notificationMsg.headings}` },
    data: { en: `${notificationMsg.data}` },
    // include_player_ids: subscriptionIdsArray, // Use the OneSignal Player ID for the user
    included_segments: subscriptionIdsArray, // Use the OneSignal Player ID for the user
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(notificationData),
    });

    const data = await response.json();
    console.log('Notification sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    return error;
  }
};

return sendNotification(subscriptionIdsArray, notificationMsg);
}


function getNotificationMsg(notificationType, record) {
  return {
    name: "",
    contents: `Your Follow up call/meeting with [Client Name] is coming up.`,
    headings: "Follow Up Reminder in 10 Minutes",
    data: `Intraday call for `,
  };
}
