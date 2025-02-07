import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import {customLog} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`


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


const returnFollowUpColumn = ['notify_status','lead_id','created_at','assigned_id','follow_up_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time','follow_up_category'].join(', ');

serve(async (req) => {
  try {
         const url = new URL(req.url);
        notifyToAllFollowUps().then(response => {
          return returnResponse(200,`Listening for cron job notifications!`,null); ;
        })
        .catch(error => {
          console.error(`Error sending notification error:`, error);
        });
        //  return new Response("Listening for cron job notifications!");
  } 
  catch (err) {
    console.error('Cron job called API >>>> : Server error: new', err);
    return returnResponse(500,`User not exist`,null);
  }
});

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
.select(`${returnFollowUpColumn},usersProfile(${['user_id', 'first_name'].join(', ')}),contacts(${['first_name','last_name','phone'].join(', ')})`)
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
        // console.log('Success updatedData ids > > :', ids);
        const result = await notifyToAllIUsers(data);
        const { data:updatedData, error } = await _supabase
        .from('follow_up')
        .update({ notify_status: true })
        .in('assigned_id',ids) 
      }
      catch(error)
      {
        console.error('Server side error ', error);
        return returnResponse(500,`Server side error ${error}`,null);
      }
      const result = await notifyToAllIUsers(data);
      return returnResponse(200, 'Success >', result);
    }
    return returnResponse(200, `No data found  > `, null);
  }
  catch (err) {
    return returnResponse(500,`Server side error ${err}`,null);
  }
}

async function notifyToAllIUsers(records){
  if(records.length>0){
      // Iterate through each record
  for (let record of records) {
    const userId = record['assigned_id'];
 const { data, error } = await _supabase
.from('logged_in_devices')
.select(`device_fcm_token`)
.eq('is_deleted', false)
.eq('user_id', userId)
if(error===null && !(data===null)){
  // Generate the list of device_fcm_token and remove null values
  let subscriptionIdsArray = data
.filter(item => item.device_fcm_token !== null) // Remove null values
.map(item => item.device_fcm_token); 
 customLog(`NotificationMsg record ####`, record);
  let notificationMsg = getNotificationMsg(1,record);
  customLog(`NotificationMsg #### ${record}`, notificationMsg);
  // Remove duplicates if necessary
   subscriptionIdsArray = [...new Set(subscriptionIdsArray)];
  // Send notification for each record
  sendNotification(subscriptionIdsArray, notificationMsg)
    .then(response => {
      console.log(`Notification sent successfully for user: ${subscriptionIdsArray}`, response);
    })
    .catch(error => {
      console.error(`Error sending notification for user: ${subscriptionIdsArray}`, error);
    });   
}
  }

  }
return {"message":"success"};
}

// Function to send notification using OneSignal
const sendNotification = async (subscriptionIdsArray, notificationMsg) => {
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
  const headers = {
    'Authorization': `Basic ${_OnesignalRestApiKey_}`,
    'Content-Type': 'application/json; charset=utf-8',
  };
  
  const notificationData = {
    app_id: _OnesignalAppId_,
    contents: { en: `${notificationMsg.contents}` }, // Message body
    headings: { en: `${notificationMsg.headings}` }, // Message title
    data: notificationMsg.data, // Correct structure; `data` doesn't need the `en` key
    include_subscription_ids: subscriptionIdsArray // Use `include_player_ids` for targeting specific users
  };

  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(notificationData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    return error;
  }
};

function getNotificationMsg(notificationType, record) {
  let usersProfile = record['usersProfile'];
  let timeStr = record['follow_up_date_time'];
  let contacts = record['contacts'];
  let leadStatusOption = record['lead_status_option'] ?? "";
  let id = record['lead_id'] ?? "";
  const date = new Date(timeStr);
  timeStr = date.toLocaleTimeString("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});
  return {
    name: "",
    contents: `Your Follow up call/meeting with ${contacts['first_name']} is coming up at ${timeStr}.`,
    headings: `${leadStatusOption}`,
    data: {  "type": "announcement","id":`${id}`},
    buttons: [
      { "id": "like-button", "text": "Like", "icon": "http://i.imgur.com/N8SN8ZS.png" },
      { "id": "read-more-button", "text": "Read More", "icon": "http://i.imgur.com/MIxJp1L.png" }
    ]
  };
}
