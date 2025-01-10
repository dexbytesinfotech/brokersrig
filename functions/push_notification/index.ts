import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as OneSignal from 'https://esm.sh/@onesignal/node-onesignal@1.0.0-beta9';
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js";
import { returnResponse } from "../response_formatter/index.ts";

// Environment variables
const _OnesignalAppId_ = Deno.env.get('ONESIGNAL_APP_ID')!;
const _OnesignalUserAuthKey_ = Deno.env.get('USER_AUTH_KEY')!;
const _OnesignalRestApiKey_ = Deno.env.get('ONESIGNAL_REST_API_KEY')!;
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL')!;
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY')!;

const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

const configuration = OneSignal.createConfiguration({
  userKey: _OnesignalUserAuthKey_,
  appKey: _OnesignalRestApiKey_,
});

const onesignal = new OneSignal.DefaultApi(configuration);

serve(async (req) => {
  try {
          // Extract request body
          const payload = await req.json();

    // Extract request body first
    const { content , notification_type_id, action_type , subscription_type_id} = payload;

    // notifcationType => 1 = intraday, 2 = long_turn, 3 = short_turn
    // subscription_type_id => 1 = Regular, 2 = Premium, 3 = all

     console.log('Incoming Payload:', payload);
   // Log the incoming record and the triggering table
    console.log('Triggered action_type:', action_type);
    console.log('notifcation_type:', notification_type_id);
    console.log('conent :', content);
    console.log('subscription_type_id:', subscription_type_id);


if(canSendNotification('table','type')){

   let notificationMsg = getNotificationMsg(notification_type_id,content);


    /// Store notification in table
    const { data, error : insertError} = await _supabase
    .from('notifications_data_table')
    .insert([
      {
        content: content,  // Insert the phone number
        notification_type_id: notification_type_id,
        action_type: action_type,
        subscription_type_id: subscription_type_id              // Insert the user's email
      }
    ]).maybeSingle().select();

    if (insertError) {
      console.error('Error checking phone number:', insertError);
      return returnResponse(500,`Error checking phone number: ${insertError.message}`,null);
    }

const { data: subscriptionData, error } = await _supabase
  .from('notifications')
  .select('*');

if (error) {
  console.error('Error fetching data:', error.message);
  return returnResponse(500,`Failed to fetch data from Supabase: ${ error.message}`,null);
}

if (!subscriptionData) {
  return returnResponse(500,`No data found in the notifications table: ${error.message}`,null);
}
// return returnResponse(500,`No data found in the notifications table: `,subscriptionData);
console.log('subscriptionData:', subscriptionData);
    // // Extract subscriptionIds from all records and convert them into a single array
    let subscriptionIdsArray = [];
    subscriptionData.forEach(record => {
      const ids = record.subscription_ids;
      
      if (ids && typeof ids === 'string') {
        // Split the string by commas to create an array
        const idArray = ids.split(',').map(id => id.trim());  // Split by commas and trim spaces
        subscriptionIdsArray = [...subscriptionIdsArray, ...idArray];
      }
    });

    console.log('subscriptionIdsArray >>>> :', subscriptionIdsArray);

    // // Remove duplicates if necessary
    subscriptionIdsArray = [...new Set(subscriptionIdsArray)];
        // Create and send OneSignal notification
        const notification = new OneSignal.Notification();
        notification.app_id = _OnesignalAppId_;
        notification.include_player_ids = subscriptionIdsArray;
        notification.contents = { en: `${notificationMsg.contents}`};
        notification.headings = { en: `${notificationMsg.headings}` };
        notification.data = { en: `${notificationMsg.data}` };
        const onesignalApiRes = await onesignal.createNotification(notification);
        return new Response(
          JSON.stringify({ onesignalResponse: onesignalApiRes }),
          { headers: { 'Content-Type': 'application/json' } }
        );
    }
else{
        console.error('Notification Event Triggered', "Notification event triggered successfully but no need to send notification");
        return new Response(`Notification Event Triggered : Notification event triggered successfully but no need to send notification`, {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        });
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
function canSendNotification(tableName: string,eventType: string): boolean{
  return true;
    // if(tableName === "intraday_announcement_table" && eventType === "INSERT"){
    //     return true;
    //     }
    // else  if(tableName === "long_term_announcement" && eventType === "INSERT"){
    //     return true;
    //     }
    // return false;

}

//notifcation_type,action_type,subscription_type_id
// Function that returns either a string or a number
function getNotificationMsg(notifcationType: number,content: string): NotificationBody {
if(notifcationType === 1){
        return {
                name: ``,
                contents: `Intraday call` ,
                headings: `Intraday call` ,
                data: `${content}`
            };
        }
    else if(notifcationType === 2){
        return {
          name: ``,
          contents: `Long-Term call` ,
          headings: `Long-Term call` ,
          data: `${content}`
            };
        }
        else if(notifcationType === 3){
          return {
            name: ``,
            contents: `Short-Term call` ,
            headings: `Short-Term call` ,
            data: `${content}`
              };
          }   
          
        else if(notifcationType === 4){
          return {
            name: ``,
            contents: `All call` ,
            headings: `All call` ,
            data: `${content}`
              };
          }  
    else {
      return {
        name: ``,
              contents: `Empty ` ,
              headings: `Empty` ,
              data: `Empty `
          };
      
        }

}


// Define the interface
interface NotificationBody {
    name: string;
    contents: string;
    headings: string;
    data: string;
}