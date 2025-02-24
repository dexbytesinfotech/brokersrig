import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders, getHeaderAuthorization,validateEndPoint,getApiRequest,getMinMaxPriceFromBudgetCode,getPriceFromString,generateUniqueIntId,validateRequredReqFields,getFilteredReqData,formatNumber,customLog} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`

// import { notifyToAllFollowUps } from "../pg_notify_cron_schedule/index.js";// Assuming this module exports `returnResponse`

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

const rangMinBudgetPer = 2;
const rangMaxBudgetPer = 2;

// const leadReturnColumn = ["id","property_type","created_at","preferred_location","min_budget","purpose","additional_details","lead_type","property_size","assigne_id","max_budget",
// "city","lat","lng","full_adress","amount_symbol_id","country_code","is_deleted","is_verified","asking_price","sell_type","budget_label"].join(', ');

const returnFollowUpColumn = ['created_at','assigned_id','follow_up_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time','follow_up_category','lead_id','notify_status'].join(', ');

const leadReturnColumn = ["id","created_at","preferred_location","min_budget","purpose","additional_details","lead_type","property_size","assigne_id","max_budget",
"city","lat","lng","full_adress","amount_symbol_id","country_code","is_deleted","is_verified","asking_price","sell_type","budget_label"].join(', ');
const returnContactColumn = ['phone','first_name','last_name','contact_id','county_code'].join(', ');

// Add lead
export async function addLead(req,userInfo) {
  try {
           const apiMethod = "POST";
/// Get data from API
const reqData = await getApiRequest(req,apiMethod);
 const missingKeys = validateRequredReqFields(reqData,['property_type','lead_type','contact_id']);
 if (missingKeys['missingKeys'].length > 0) {
   console.error('Please enter mandatory fields data', "error");
   return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
 }
const userData = {};

if(('budget_code' in reqData || 'asking_price' in reqData)) {

  userData["property_type"] = reqData["property_type"];
  userData["lead_type"] = reqData["lead_type"];
  userData["contact_id"] = reqData["contact_id"];
  userData["city"] = reqData["city"];

  if('additional_details' in reqData){
  userData["additional_details"] = reqData["additional_details"];
  }

  if('property_size' in reqData){
  userData["property_size"] = reqData["property_size"];
  }

  if(reqData["lead_type"]=="sell_lead"  || reqData["lead_type"]=="rental_lead"){
    if('sell_type' in reqData){    
      userData["sell_type"] = reqData["sell_type"];
      }

    if('asking_price' in reqData){
      const budgetValues = getPriceFromString(reqData["asking_price"]);
         userData["min_budget"] = 0;
         userData["max_budget"] = 0;
         userData["asking_price"] = budgetValues[0];

         const budgetLabel = reqData["asking_price"];
         userData["budget_label"] = budgetLabel;

       }

  }
  else{
    if('budget_code' in reqData){
      const budgetValues = getMinMaxPriceFromBudgetCode(reqData["budget_code"]);
     
         userData["min_budget"] = budgetValues[0];
         userData["max_budget"] = budgetValues[1];

         const budgetLabel = await getBudgetLabel(reqData["budget_code"]);
         userData["budget_label"] = budgetLabel;
         userData["budget_code"] = reqData["budget_code"];
       }
  }

  if('lng' in reqData && 'lat' in reqData){
  userData["lng"] = reqData["lng"];
  userData["lat"] = reqData["lat"];
  }
  
    
  if('preferred_location' in reqData){
    userData["preferred_location"] = reqData["preferred_location"];
    }

  if('full_adress' in reqData){
  userData["full_adress"] = reqData["full_adress"];
  }
  
  if('amount_symbol_id' in reqData){
  userData["amount_symbol_id"] = reqData["amount_symbol_id"];
  }
  
  if('country_code' in reqData){
  userData["country_code"] = reqData["country_code"];
  }

}
// Check if the email exists in the `users` table
if(!(JSON.stringify(userData) === '{}')){
  const { data, error } = await _supabase
  .from('leads')
  .insert(
    userData,
  )
  .select(`id`)
  .single();
  if (error) {
    console.error('Failed:', error);
    return returnResponse(500, `Failed: ${error.message}`, null);
  }

const leadDetails = data;
const leadId = leadDetails['id'];

if('lat' in userData && 'lng' in userData){
    // Calling the custom RPC function to get coordinates
    const { data: coordinates, error: coordinatesError } = await _supabase
      .rpc('set_coordinates', {
        p_lat: userData["lat"],
        p_lon: userData["lng"],
        p_id:leadId
      });
  
    if (coordinatesError) {
      customLog(' coordinates error ####', coordinatesError);
    }
  }

// Add lead in user lead refrence table
if(!(leadDetails===null)){
  const { data, error } = await _supabase
  .from('rUserLeads')
  .insert([
    {
      "user_id": userInfo['id'],
      "lead_id": leadId
    },
  ])
  .select(`lead_id`)
  .single();

  const { data:assignedData, error:assignedError } = await _supabase
  .from('lead_assigne')
  .insert([
    {
      "assigned_id": userInfo['id'],
      "assigned_by_id": userInfo['id'],
      "lead_id": leadId
    },
  ])
  .select(`lead_id`)
  .single();
  if (assignedError) {
    console.error('Failed: to set assigned id ', assignedError);
  }
  if (error) {
    console.error('Failed:', error);
    return returnResponse(500, `Failed: ${error.message}`, null);
  }
}
const { data: leadDetail, error: error1 }  = await asyncgetLeadDetails(leadId);
if (error1) {
  console.error('Error fetching joined data:', error1);
  return returnResponse(500, `Failed: ${error.message}`, null);
} 

if(leadDetail!=null){
  return returnResponse(200, 'Success', leadDetail);
}
else
{
  return returnResponse(400, 'No data found', []);
}
}
else {
  console.error('Please enter mandatory fields data', "error");
  return returnResponse(500, `Please enter mandatory fields data`, null);
}
}catch (err) {
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
          }
}

export async function updateLead(req,userInfo) {

  try {
    const apiMethod = "POST";
/// Get data from API
const reqData = await getApiRequest(req,apiMethod);

if (reqData["lead_id"]<= 0) {
return returnResponse(400,JSON.stringify({ error: "Unathoried user"}),null);
}

// Check if the email exists in the `users` table
const { data, error } = await _supabase
.from('rUserLeads')
.select('*')
.eq('user_id',userInfo['id'])
.eq('lead_id',reqData['lead_id'])
.eq('is_deleted',false)
.single();
if (error) {
  console.error('Error checking leads:', error);
  return returnResponse(500, `Error checking email: ${error.message}`, null);
}



if (data===null) {
  console.error('Lead not found:', error);
  return returnResponse(500, `Lead not found.`, null);
}

const userData = {};

if('lead_id' in reqData &&  ('budget_code' in reqData || 'asking_price' in reqData)) {

// userData['user_id'] = userInfo['id'];
if('property_type' in reqData){
userData["property_type"] = reqData["property_type"];
}
if('lead_type' in reqData){
userData["lead_type"] = reqData["lead_type"];
}

if('contact_id' in reqData){
userData["contact_id"] = reqData["contact_id"];
}

if('city' in reqData){
userData["city"] = reqData["city"];
}


if('additional_details' in reqData){
userData["additional_details"] = reqData["additional_details"];
}

if('property_size' in reqData){
userData["property_size"] = reqData["property_size"];
}


if(reqData["lead_type"]=="sell_lead"  || reqData["lead_type"]=="rental_lead"){
  if('sell_type' in reqData){    
    userData["sell_type"] = reqData["sell_type"];
    }
  if('asking_price' in reqData){
    const budgetValues = getPriceFromString(reqData["asking_price"]);
       userData["min_budget"] = 0;
       userData["max_budget"] = 0;
       userData["asking_price"] = budgetValues[0];

       userData["budget_label"] = reqData["asking_price"];
     }
}
else{
  if('budget_code' in reqData){
    const budgetValues = getMinMaxPriceFromBudgetCode(reqData["budget_code"]);
     
         userData["min_budget"] = budgetValues[0];
         userData["max_budget"] = budgetValues[1];

         const budgetLabel = await getBudgetLabel(reqData["budget_code"]);
         userData["budget_label"] = budgetLabel;
         userData["budget_code"] = reqData["budget_code"];
     }
}

if('lat' in reqData && 'lng' in reqData){
userData["lng"] = reqData["lng"];
userData["lat"] = reqData["lat"];
  // Calling the custom RPC function to get coordinates
  const { data: coordinates, error: coordinatesError } = await _supabase
    .rpc('set_coordinates', {
      p_lat: userData["lat"],
      p_lon: userData["lng"],
      p_id:reqData['lead_id']
    });

  if (coordinatesError) {
    customLog(' coordinates error ####', coordinatesError);
  }
}


if('preferred_location' in reqData){
  userData["preferred_location"] = reqData["preferred_location"];
  }

if('full_adress' in reqData){
userData["full_adress"] = reqData["full_adress"];
}

if('amount_symbol_id' in reqData){
userData["amount_symbol_id"] = reqData["amount_symbol_id"];
}

if('country_code' in reqData){
userData["country_code"] = reqData["country_code"];
}

}
// Check if the email exists in the `users` table
if(!(JSON.stringify(userData) === '{}')){
const { data, error } = await _supabase
.from('leads')
.update(
userData,
)
.eq('id', reqData['lead_id'])
.select(`id`)
.single();

if (error) {
console.error('Failed:', error);
return returnResponse(500, `Failed: ${error.message}`, null);
}

const { data: leadDetail, error: error1 }  = await asyncgetLeadDetails(reqData['lead_id']);
if (error1) {
  console.error('Error fetching joined data:', error1);
  return returnResponse(500, `Failed: ${error.message}`, null);
} 
if(leadDetail!=null){
  return returnResponse(200, 'Success', leadDetail);
}
else
{
  return returnResponse(400, 'No data found', []);
}
}
else {
console.error('Please enter mandatory fields data', "error");
return returnResponse(500, `Please enter mandatory fields data`, null);
}
}catch (err) {
     console.error('Server error: new', err);
     return returnResponse(500,`User not exist`,null);
   }
}

/// Delete leads
export async function deleteLead(req,userInfo) {
  try {
           const apiMethod = "DELETE";
/// Get data from API
const reqData = await getApiRequest(req,apiMethod);
if (reqData["id"]<= 0) {
  return returnResponse(400,"Unathoried user",null);
}

if(!('lead_id' in reqData) ||  reqData["lead_id"]===null){
  return returnResponse(400,"Contact id Reqired",null);
}
// Check if the email exists in the `users` table
const { data, error } = await _supabase
.from('rUserLeads')
.select('*')
.eq('user_id',userInfo['id'])
.eq('lead_id',reqData['lead_id'])
.eq('is_deleted',false)
.maybeSingle();
if (error) {
  console.error('Error checking leads:', error);
  return returnResponse(500, `Error checking email: ${error.message}`, null);
}

if (data===null) {
  console.error('Contact already added:', error);
  return returnResponse(500, `Selected data not found..`, null);
}

const userData = {"is_deleted":true};

// Check if the email exists in the `users` table
if(!(JSON.stringify(userData) === '{}')){
  const { data, error } = await _supabase
  .from('rUserLeads')
  .update([
    userData,
  ])
  .eq('lead_id', reqData["lead_id"])
  .select();

  const {data:data1, error:error1} = await _supabase
  .from('leads')
  .update([
    userData,
  ])
  .eq('id', reqData["lead_id"])
  .select(`id`);

  if (error1) {
    console.error('Failed:', error1);
    return returnResponse(500, `Failed: ${error1.message}`, null);
  }

return returnResponse(200, `Deleted successfully`, []); 
}
else {
  console.error('Please enter mandatory fields data', "error");
  return returnResponse(500, `Please enter mandatory fields data`, null);
}
}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}

/// Get  Lead type
export async function getLeadType(req,userInfo) {
  try {
           const apiMethod = "GET";
const returnLeadTypeColumn = ['lead_type','created_at','title'].join(', ');
// Check if the email exists in the `users` table
const { data, error } = await _supabase
  .from('leadType')
  .select(returnLeadTypeColumn).eq("is_deleted",false).order('id', { ascending: true });

if (error) {
  console.error('Error checking leads:', error);
  return returnResponse(500, `Error checking leads: ${error.message}`, null);
}

// Check for multiple rows and handle accordingly
if (!data || data.length === 0) {
  customLog('No leads found');
  return returnResponse(404, 'No leads found', null);
}

// Single row returned
const leads = data;
return returnResponse(200, 'Account type retrieved successfully.', leads);
}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}

/// Get  Lead type
export async function getLeads(req,userInfo) {
  try {
const { data: data1, error: error1 } = await _supabase
  .from('rUserLeads')
  .select(`leads(${leadReturnColumn},contacts(${returnContactColumn}),
  propertyType(${['title','property_type'].join(', ')}))
`)
  .eq('is_deleted', false)
  .eq('user_id', userInfo.id)
  .eq('leads.is_deleted', false) // Filter on contact's 'is_deleted' (if needed)
  .order('id', { ascending: false });

if (error1) {
  console.error('Error fetching joined data:', error1);
} 

if(data1!=null && data1.length>0){
  const leadList = data1.map((item) => item.leads).filter((lead) => lead != null);
  return returnResponse(200, 'Success', leadList);
}
else
{
  return returnResponse(400, 'No data found', []);
}

}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}

/// Get  Lead type
export async function getContactLeads(req,userInfo) {
  try {
           const apiMethod = "GET";

 const reqData = await getApiRequest(req,apiMethod);
if(reqData["contact_id"]<= 0 ){
  return returnResponse(400,"Contact id Reqired",null);
}
const { data: data1, error: error1 } = await _supabase
  .from('rUserLeads')
  .select(`leads(${leadReturnColumn},contacts(${returnContactColumn}),
  propertyType(${['title','property_type'].join(', ')}))
`)
  .eq('is_deleted', false)
  .eq('user_id', userInfo.id)
  .eq('leads.is_deleted', false) 
  .eq('leads.contact_id', reqData.get("contact_id")) // Filter on contact's 'is_deleted' (if needed)
  .order('id', { ascending: false });

if (error1) {
  console.error('Error fetching joined data:', error1);
} 

if(data1!=null && data1.length>0){
  const leadList = data1.map((item) => item.leads).filter((lead) => lead != null);
  return returnResponse(200, 'Success', leadList);
}
else
{
  return returnResponse(400, 'No data found', []);
}

}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}

/// Get  Lead details
export async function getLeadDetails(req,userInfo) {
  try {
           const apiMethod = "GET";
            const reqData = await getApiRequest(req,apiMethod);

            const { data: leadDetail, error: error1 }  = await asyncgetLeadDetails(reqData.get("lead_id"));
            if (error1) {
              console.error('Error fetching joined data:', error1);
              return returnResponse(500, `Failed: ${error1.message}`, null);
            } 
if(leadDetail!=null){
  return returnResponse(200, 'Success', leadDetail);
}
else
{
  return returnResponse(400, 'No data found', {});
}

}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}

async function asyncgetLeadDetails(leadId) {
  const { data: leadDetail, error: error1 } = await _supabase
  .from('leads')
  .select(`${leadReturnColumn},
  contacts(${returnContactColumn}),
  propertyType(${['title','property_type'].join(', ')}),
  lead_assigne(usersProfile(${['user_id','first_name'].join(', ')})),
  inventories(${['inventory_id'].join(', ')}),
  media_files(
    file_url, media_type, category, sub_category, file_id, media_for
  )
 
`)
  .eq('is_deleted', false)
  .eq('media_files.is_deleted', false)
  .eq('lead_assigne.is_deleted', false)
  .eq('lead_assigne.is_active', true)
  .eq('id', leadId).single();

  if (error1) {
    console.error('Error fetching joined data:', error1);
    return { data: null, error: error1 };
  }

  let leadDetailDetails = leadDetail;

  if("inventories" in leadDetailDetails && leadDetailDetails["inventories"]!=null && leadDetailDetails["inventories"].length>0){
    // leadDetailDetails["inventories"] = true;
    delete leadDetailDetails.inventories;
    leadDetailDetails["is_published"] = true;
  }
  else {
    delete leadDetailDetails.inventories;
    leadDetailDetails["is_published"] = false;
  }

  return { data: leadDetailDetails, error: error1 };
}

async function getBudgetLabel(budgetCode) {

const normalizedBudgetCode = budgetCode.toLowerCase();
console.error('budgetCode >>>> ', normalizedBudgetCode);
const { data, error } = await _supabase.from('priceRange')
.select('*')
.eq('budget_code',normalizedBudgetCode)
.eq('is_deleted',false).single();
if(error){
  console.error('budgetCode error >>>> ', error);
return "";
}

if(data!=null){
  return data["title"];
}
return "";
}




export async function getMatchedLeads(req,userInfo) {
try {
   /// Get data from API
const reqData = await getApiRequest(req,"GET");
const missingKeys = validateRequredReqFields(reqData,['lead_type','property_type']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  } 

const localReqData = getFilteredReqData(reqData,['lead_type','property_type','search_location','city','min_budget','max_budget','sell_type','asking_price','lat','lng','radius']);
const allowedLeadType = ['buy','sell','rent','rental','invest'];  
var searchLeadType = localReqData['lead_type'];

var propertyType = localReqData['property_type'];

if (!allowedLeadType.includes(searchLeadType.toLowerCase())) {
  return returnResponse(500, `Invalid lead_type valu. Expected ${allowedLeadType}, but received '${allowedLeadType}`, null);
}

switch (localReqData['lead_type'].toLowerCase()){
case 'buy': {
  searchLeadType = "Sell" ;
}
break
case 'sell': {searchLeadType = "Buy";} 
break
case 'invest': {searchLeadType = "Buy";} 
break
case 'rent': {searchLeadType = "Rental"; }
break
case 'rental': {searchLeadType = "Rent" ; }
break
}

const locationLat = 'lat' in localReqData?localReqData['lat']:0;
const locationLng = 'lng' in localReqData?localReqData['lng']:0;
const locationRadius = 'radius' in localReqData?localReqData['radius']:5000;

let lowerBoundPrice = 0;
let upperBoundPrice = 0;
let isAskingPrice = false;

if ('asking_price' in localReqData) {

  let askingPrice = localReqData['asking_price'];

  if(searchLeadType.toLowerCase()==="rental" || searchLeadType.toLowerCase()==="sell"){
    const difference = (askingPrice * rangMinBudgetPer) / 100;
     lowerBoundPrice = askingPrice - difference;
     upperBoundPrice = askingPrice + difference;
     isAskingPrice = true;
    // query = query.gte('leads.asking_price', lowerBoundPrice)  // follow_up_date_time >= lowerBound
    // .lte('leads.asking_price', upperBoundPrice);  // follow_up_date_time <= upperBound
  }
  else  if(searchLeadType.toLowerCase()==="rent" || searchLeadType.toLowerCase()==="buy"){
    const difference = (askingPrice * rangMaxBudgetPer) / 100;
     lowerBoundPrice = askingPrice - difference;
     upperBoundPrice = askingPrice + difference;
     isAskingPrice = false;
    // query = query.gte('leads.max_budget', lowerBoundPrice)  // follow_up_date_time >= lowerBound
    // .lte('leads.max_budget', upperBoundPrice);  // follow_up_date_time <= upperBound
  }
}

    // Calling the custom RPC function to get coordinates
    const { data: userData, error: coordinatesError } = await _supabase
    .rpc('get_nearby_locations', {
      u_id:userInfo.id,
      p_lat: locationLat,
      p_lon: locationLng,
      p_radius:locationRadius,
      property_type_title:propertyType,
      search_lead_type_title:searchLeadType,
      p_min_price:lowerBoundPrice,  
      p_max_price:upperBoundPrice,
      is_asking_price:isAskingPrice 
    });

  if (coordinatesError) {
    customLog(' coordinates error ####', coordinatesError);
    // return returnResponse(500, `Failed `, coordinatesError);
  }
  else {
 if(userData['result']!=null && userData['result'].length>0){
   return returnResponse(200, `Success`, userData['result']);
}
else
{
  return returnResponse(400, 'No data found', []);
}
    // return returnResponse(200, `Success`, userData['result']);
  }


// let query = _supabase
//   .from('rUserLeads')
//   .select(`
//     leads (
//       ${leadReturnColumn},contacts(${returnContactColumn}),
//       propertyType(title, property_type),
//       leadType(title, lead_type)
//     )
//   `)
//   .eq('is_deleted', false)
//   .eq('user_id', userInfo.id)
//   .eq('leads.is_deleted', false)
//   .eq('leads.propertyType.title', propertyType) // Correct field path
//   .eq('leads.leadType.title', searchLeadType) // Correct field path
//   .not('leads.leadType', 'is', null) // Exclude null leadType
//   .not('leads.propertyType', 'is', null) // Exclude null propertyType
//   .order('id', { ascending: false });

// // Add the filter only if searchAddress has a value
// if ('search_location' in localReqData) {
//   query = query.ilike('leads.full_adress', `%${localReqData['search_location']}%`);
                             
// }
// // Add the filter only if city has a value
// if ('city' in localReqData) {
//   query = query.ilike('leads.city', `%${localReqData['city']}%`);
// }

// // Add the filter only if city has a value
// if ('sell_type' in localReqData) {
//   query = query.ilike('leads.sell_type', `%${localReqData['sell_type']}%`);
// }

// // Add Price query for rental or rent case
// if ('asking_price' in localReqData) {

//   let askingPrice = localReqData['asking_price'];

//   if(searchLeadType.toLowerCase()==="rental" || searchLeadType.toLowerCase()==="sell"){
//     const difference = (askingPrice * rangMinBudgetPer) / 100;
//     let lowerBoundPrice = askingPrice - difference;
//     let upperBoundPrice = askingPrice + difference;
//     query = query.gte('leads.asking_price', lowerBoundPrice)  // follow_up_date_time >= lowerBound
//     .lte('leads.asking_price', upperBoundPrice);  // follow_up_date_time <= upperBound
//   }
//   else  if(searchLeadType.toLowerCase()==="rent" || searchLeadType.toLowerCase()==="buy"){
//     const difference = (askingPrice * rangMaxBudgetPer) / 100;
//     let lowerBoundPrice = askingPrice - difference;
//     let upperBoundPrice = askingPrice + difference;
//     query = query.gte('leads.max_budget', lowerBoundPrice)  // follow_up_date_time >= lowerBound
//     .lte('leads.max_budget', upperBoundPrice);  // follow_up_date_time <= upperBound
//   }
// }

// const { data: data1, error: error1 } = await query;

// if (error1) {
//   console.error('Error fetching joined data:', error1);
// } 

// if(data1!=null && data1.length>0){
//   const leadList = data1.map((item) => item.leads).filter((lead) => lead != null);
//   return returnResponse(200, 'Success',  {"propertyType":propertyType, "searchLeadType":searchLeadType,data:leadList} );
// }
// else
// {
//   return returnResponse(400, 'No data found', []);
// }

}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`Lead not found`,err);
 }
}

// Function to fetch data within the circle's radius
function fetchDataWithinRadius(centerLat, centerLng, radius, locations) {
  return locations.filter(location => {
      const distance = getDistance(centerLat, centerLng, location.lat, location.lng);
      return distance <= radius;
  });
}
// Function to calculate distance between two coordinates using the Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * 
      Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Convert km to meters
}

export async function addLeadFollowUp(req,userInfo){
  try
  {
/// Get data from API
const reqData = await getApiRequest(req,"POST");
  const missingKeys = validateRequredReqFields(reqData,['lead_id','contact_id','lead_status','lead_status_option','follow_up_date_time','follow_up_category']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

      const localReqData = getFilteredReqData(reqData,['lead_id','contact_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time','follow_up_category']);
    const followupId = generateUniqueIntId({length : 4 ,sliceLength : 6});
     localReqData['follow_up_id'] = followupId;
     localReqData['user_id'] = userInfo['id'];

     var assignId =  userInfo['id'];

     const { data:leadAssigneData, error:leadAssigneError } = await _supabase
     .from('lead_assigne')
     .select(`assigned_id`)
     .eq('lead_id',localReqData['lead_id'])
     .eq('is_active',true)
     .maybeSingle();
     if (leadAssigneError) {
       console.error('Failed:', leadAssigneError);
       return returnResponse(500, `Followup add Failed: ${leadAssigneError.message}`, null);
     }
     if(!(leadAssigneData===null) && leadAssigneData.lengt>0){
      assignId = leadAssigneData['assigned_id'];
     }
     localReqData['assigned_id'] = assignId;
     const timestamp = localReqData['follow_up_date_time'];
     localReqData['follow_up_date_time'] = new Date(timestamp).toISOString();
      const { data, error } = await _supabase
      .from('follow_up')
      .insert(
        localReqData,
      )
      .select(`${returnFollowUpColumn},usersProfile(${['user_id','first_name'].join(', ')}),contacts(${['first_name','last_name','phone'].join(', ')})`)
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Followup add Failed: ${error.message}`, null);
      }
    // Add lead in user lead refrence table
    if(!(data===null)){
      return returnResponse(200, 'Success', data);
    }
    return returnResponse(500, `Failed: ${error.message}`, null);    
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}

export async function updateLeadFollowUp(req,userInfo){
  try
  {
    //  return await notifyToAllFollowUps();
/// Get data from API
const reqData = await getApiRequest(req,"POST");
  const missingKeys = validateRequredReqFields(reqData,['follow_up_id']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

      const localReqData = getFilteredReqData(reqData,['follow_up_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time']);
     const followupId =  localReqData['follow_up_id'];
     localReqData['follow_up_id'] = followupId;
     localReqData['user_id'] = userInfo['id'];

     var assignId =  userInfo['id'];

    //  return returnResponse(200, `Project details ${projectId}`,localReqData);
      const { data, error } = await _supabase
      .from('follow_up')
      .update(
        localReqData,
      )
      .eq('follow_up_id',followupId)
      .eq('user_id',userInfo['id'])
      .select(`${returnFollowUpColumn},usersProfile(${['user_id','first_name'].join(', ')})`)
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Followup add Failed: ${error.message}`, null);
      }
    // Add lead in user lead refrence table
    if(!(data===null)){
      return returnResponse(200, 'Success', data);
    }
    return returnResponse(500, `Failed: ${error.message}`, null);    
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}


export async function getLeadFollowUpDetail(req,userInfo){

  try
  {
/// Get data from API
const reqData = await getApiRequest(req,"GET");

  const missingKeys = validateRequredReqFields(reqData,['follow_up_id']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

     const localReqData = getFilteredReqData(reqData,['follow_up_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time']);
     const followupId =  localReqData['follow_up_id'];
     localReqData['follow_up_id'] = followupId;
     localReqData['user_id'] = userInfo['id'];

     var assignId =  userInfo['id'];

    //  return returnResponse(200, `Project details ${projectId}`,localReqData);
      const { data, error } = await _supabase
      .from('follow_up')
      .select(`${returnFollowUpColumn},usersProfile(${['user_id','first_name'].join(', ')})`)
      .eq('follow_up_id',followupId)
      .eq('user_id',userInfo['id'])
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Followup add Failed: ${error.message}`, null);
      }
    // Add lead in user lead refrence table
    if(!(data===null)){
      return returnResponse(200, 'Success', data);
    }
    return returnResponse(200, `No data found`, null);    
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}

export async function getLeadAllFollowUps(req,userInfo){
  try
  {
       /// Get data from API
      const reqData = await getApiRequest(req,"GET");

      const localReqData = getFilteredReqData(reqData,['lead_id','follow_up_date_time','item_limit']);
      const userId = userInfo['id'] ?? null; // Use null if undefined
      const leadId = localReqData['lead_id'] ?? null; // Use null if undefined
      const itemLimit = localReqData['item_limit']??50;
      const dateTime = localReqData['follow_up_date_time'] ?? null; // Use null if undefined
      const date = (!(dateTime===null) && !(dateTime===""))?new Date(Number(dateTime)).toISOString().split('T')[0] : null;
      var dataList = [];
      let query = _supabase
      .from('follow_up')
      .select(`${returnFollowUpColumn},usersProfile(${['user_id', 'first_name'].join(', ')}),contacts(${['first_name','last_name','phone'].join(', ')})`)

      /// Return data acording to user base and lead base
      if(!(dateTime===null) && !(leadId===null)){
        query.eq('user_id', userId)
        .eq('is_deleted', false)
        .eq('lead_id', leadId)
        .filter('follow_up_date_time', 'gte', `${date}T00:00:00.000Z`) // Start of the day
        .filter('follow_up_date_time', 'lt', `${date}T23:59:59.999Z`)
        .order('follow_up_date_time', { ascending: true });
      }
      else if(!(dateTime===null)) {
  query.eq('user_id', userId)
  .eq('is_deleted', false)
  .filter('follow_up_date_time', 'gte', `${date}T00:00:00.000Z`) // Start of the day
  .filter('follow_up_date_time', 'lt', `${date}T23:59:59.999Z`) // End of the day
  .order('follow_up_date_time', { ascending: true });
    }

      else if(!(leadId===null)){
      query.eq('is_deleted', false)
      .eq('user_id', userId)
      .eq('lead_id', leadId).order('created_at', { ascending: true })
      .order('follow_up_date_time', { ascending: true });
    }
    else {
      query.eq('is_deleted', false)
      .eq('user_id', userId).order('created_at', { ascending: false });
    }
    
    query.limit(itemLimit);

    const { data, error } = await query;
        if (error) {
          console.error('Failed:', error);
          return returnResponse(500, `Followup add Failed: ${error.message}`, null);
        }
      // Add lead in user lead refrence table
      if(!(data===null) && (data.length>0)){
if((dateTime===null) && !(leadId===null)){
  dataList = data.sort((a, b) => 
new Date(b.follow_up_date_time) - new Date(a.follow_up_date_time)
);}
else {
  dataList = data.sort((a, b) => 
  new Date(a.follow_up_date_time) - new Date(b.follow_up_date_time)
);
}
      }
    // Add lead in user lead refrence table
    if(!(dataList===null) && (dataList.length>0)){
      return returnResponse(200, 'Success', dataList);
    }
    return returnResponse(200, `No data found`, null);
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}