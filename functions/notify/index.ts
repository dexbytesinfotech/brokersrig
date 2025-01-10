import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as OneSignal from 'https://esm.sh/@onesignal/node-onesignal@1.0.0-beta9';
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js";

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
    const { record , table, eventType , type} = payload;
     console.log('Incoming Payload:', payload);
   // Log the incoming record and the triggering table
    console.log('Triggered Table:', table);
    console.log('Event Type:', eventType);
    console.log('Event Type new :', type);
    console.log('Record:', record);


if(canSendNotification(table,type)){

   let notificationMsg = getNotificationMsg(table,type,record);
    // Fetch data from Supabase based on user_id from the record
        const { data: subscriptionData, error } = await _supabase
          .from('notifications')
          .select('subscriptionIds')
          .neq('subscriptionIds', null)  // Exclude empty strings
          .neq('subscriptionIds', "");  // Exclude empty strings

        if (error || !subscriptionData || subscriptionData.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch data from Supabase or no data found.' }),
            { status: 500 }
          );
        }

    // Extract subscriptionIds from all records and convert them into a single array
    let subscriptionIdsArray = [];
    subscriptionData.forEach(record => {
      const ids = record.subscriptionIds;
      if (ids && typeof ids === 'string') {
        // Split the string by commas to create an array
        const idArray = ids.split(',').map(id => id.trim());  // Split by commas and trim spaces
        subscriptionIdsArray = [...subscriptionIdsArray, ...idArray];
      }
    });

    // Remove duplicates if necessary
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
    if(tableName === "intraday_announcement_table" && eventType === "INSERT"){
        return true;
        }
    else  if(tableName === "long_term_announcement" && eventType === "INSERT"){
        return true;
        }
    return false;

}


// Function that returns either a string or a number
function getNotificationMsg(tableName: string,eventType: string,record): NotificationBody {
if(tableName === "intraday_announcement_table" && eventType === "INSERT"){
        return {
                name: ``,
                contents: `Intraday call for ${record.company_name}` ,
                headings: `Intraday call` ,
                data: `Intraday call for ${record.company_name}`
            };
        }
    else if(tableName === "long_term_announcement" && eventType === "INSERT"){
        return {
          name: ``,
          contents: `Long-Term call for ${record.company_name}` ,
          headings: `Long-Term call` ,
          data: `Long-Term call for ${record.company_name}`
            };
        }
        else if(tableName === "short_term_announcement" && eventType === "INSERT"){
          return {
            name: ``,
            contents: `Short-Term call for ${record.company_name}` ,
            headings: `Short-Term call` ,
            data: `Short-Term call for ${record.company_name}`
              };
          }    
    else {
      return {
        name: ``,
              contents: `Empty ${record.company_name}` ,
              headings: `Empty` ,
              data: `Empty ${record.company_name}`
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