import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders, getApiRequest,getMinMaxPriceFromBudgetCode,getPriceFromString,generateUniqueIntId} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`
import {verifyJWT } from "../jwt_auth/index.js";

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

const leadReturnColumn = ["created_at","preferred_location","min_budget","purpose","additional_details","lead_type","property_size","assigne_id","max_budget",
"city","lat","lng","full_adress","amount_symbol_id","country_code","is_deleted","is_verified","asking_price","sell_type"].join(', ');
const invertoryReturnColumn = ["created_at","preferred_location","min_budget","purpose","additional_details","lead_type","property_size","assigne_id","max_budget",
"city","lat","lng","full_adress","amount_symbol_id","country_code","is_deleted","is_verified","asking_price","sell_type","inventory_id","lead_id"].join(', ');
const returnContactColumn = ['phone','first_name','last_name','contact_id','county_code'].join(', ');


export async function pulishInvertory(req,userInfo){
  try
  {
/// Get data from API
const reqData = await getApiRequest(req,"POST");
if (reqData["lead_id"]<= 0) {

  return returnResponse(400,"Lead id mandatory",null);
}
const leadId = reqData['lead_id'];
// Check if the email exists in the `users` table
const { data, error } = await _supabase
.from('rUserInventories')
.select('*')
.eq('user_id',userInfo['id'])
.eq('lead_id',leadId)
.eq('is_deleted',false)
.maybeSingle();

console.log('Found data', data);

if(error) {
  console.error('Server error: new', error);
  return returnResponse(500,`Data not found`,null);
}
var invertoryId;
if(data==null){
  invertoryId = generateUniqueIntId({randomRange:10000});
  console.log('invertoryId >>>> if :', invertoryId);
const { data: leadDetail, error: error1 }  = await asyncgetLeadDetails(leadId);
if (error1) {
              console.error('Error fetching joined data:', error1);
              return returnResponse(500, `Failed: ${error1.message}`, null);
            }
 if(!(leadDetail===null)){
  leadDetail["inventory_id"] = invertoryId;
  leadDetail["lead_id"] = reqData['lead_id'];
    // Inset in invertory table
    const { data:daveData, error:error1 } = await _supabase
    .from('rUserInventories')
    .insert(
      {
        "user_id": userInfo['id'],
        "lead_id": leadId,
        "inventory_id":invertoryId
      },
    )
    .select(`*`)
    .single();
    if (error1) {
      console.error('Failed:', error1);
      return returnResponse(500, `Failed: ${error1.message}`, null);
    }

const { data:daveData1, error:error2} = await _supabase
.from('rUserLeads')
.update(
  {
    "inventory_id":invertoryId
  },
)
.eq('lead_id', leadId)
.select(`*`)
.single();

console.error('Fetched lead data >>00:', leadDetail); 
  // Inset in invertory table
  const {  data:daveData2, error:error3 } = await _supabase
  .from('inventories')
  .insert(
    leadDetail,
  )
  .select('inventory_id')
  .single();
  if (error3) {
    console.error('Failed:', error3);
    return returnResponse(500, `Failed: ${error3.message}`, null);
  }
  const { data: inventoryDetail, error: errorInventory }  = await asyncgetInventoryDetails(daveData2["inventory_id"]);
  if (errorInventory) {
                console.error('Error fetching joined data:', error1);
                return returnResponse(500,`Server side error ${err}`,null);
              } 
  if(inventoryDetail!=null){
    return returnResponse(200, 'Published', leadDetail);
  }
  else
  {
    return returnResponse(500,`Server side error ${err}`,null);
  }
 } 
}
else{
  // Update Invertory
  invertoryId = data["inventory_id"];

  if(invertoryId===null){
    invertoryId = generateUniqueIntId({randomRange:10000});
  }
  console.log('invertoryId >>>> else :', invertoryId);

  const { data: leadDetail, error: error1 }  = await asyncgetLeadDetails(leadId);
if (error1) {
              console.error('Error fetching joined data:', error1);
              return returnResponse(500, `Failed: ${error1.message}`, null);
            }
            leadDetail["lead_id"] = reqData['lead_id'];  
            console.error('Fetched lead data >>:', leadDetail);                 
  const { data:daveData1, error:error2} = await _supabase
.from('inventories')
.update(
  leadDetail
)
.eq('inventory_id', invertoryId)
.select('inventory_id')
.single();

if (error2) {
  console.error('Failed:', error2);
  return returnResponse(500, `Failed: ${error2.message}`, null);
}

const { data: inventoryDetail, error: errorInventory }  = await asyncgetInventoryDetails(daveData1["inventory_id"]);
if (errorInventory) {
              console.error('Error fetching joined data:', error1);
              return returnResponse(500,`Server side error ${err}`,null);
            } 
if(inventoryDetail!=null){
  return returnResponse(200, 'Published', leadDetail);
}
else
{
  return returnResponse(500,`Server side error ${err}`,null);
}

}
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}



async function updateLead(req,userInfo) {

  try {
    const apiMethod = "POST";
     // Validate headers and method
     const errors = validateHeaders(apiMethod,req.headers);
     if (errors.length > 0) {
       return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
     }

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
.maybeSingle();
if (error) {
  console.error('Error checking leads:', error);
  return returnResponse(500, `Error checking email: ${error.message}`, null);
}

console.log(' User information ######################  data', data);

if (data===null) {
  console.error('Lead not found:', error);
  return returnResponse(500, `Lead not found.`, null);
}
console.log(' User information ######################', userInfo);

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


if(reqData["lead_type"]=="sell_lead"){
  if('sell_type' in reqData){    
    userData["sell_type"] = reqData["sell_type"];
    }
  if('asking_price' in reqData){
    const budgetValues = getPriceFromString(reqData["asking_price"]);
       userData["min_budget"] = 0;
       userData["max_budget"] = 0;
       userData["asking_price"] = budgetValues[0];
     }
}
else{
  if('budget_code' in reqData){
    const budgetValues = getMinMaxPriceFromBudgetCode(reqData["budget_code"]);
       userData["min_budget"] = budgetValues[0];
       userData["max_budget"] = budgetValues[1];
     }
}
// if('min_budget' in reqData){
// userData["min_budget"] = reqData["min_budget"];
// }

// if('max_budget' in reqData){
// userData["max_budget"] = reqData["max_budget"];
// }

if('lat' in reqData){
userData["lat"] = reqData["lat"];
}

if('lng' in reqData){
userData["lng"] = reqData["lng"];
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
console.log(' User information ###################### userData', userData);
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
var leadDetails = data;
console.log(' User information ###################### leadDetails', leadDetails);
// Add lead in user lead refrence table
// if(!(leadDetails===null)){
// const { data, error } = await _supabase
// .from('rUserLeads')
// .insert([
// {
// "user_id": userInfo['id'],
// "lead_id": leadDetails['id']
// },
// ])
// .select(`id`)
// .single();

// if (error) {
// console.error('Failed:', error);
// return returnResponse(500, `Failed: ${error.message}`, null);
// }
// }


const { data: leadDetail, error: error1 }  = await asyncgetLeadDetails(reqData['lead_id']);
if (error1) {
  console.error('Error fetching joined data:', error1);
  return returnResponse(500, `Failed: ${error.message}`, null);
} 
if(leadDetail!=null && leadDetail.length>0){
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
async function deleteLead(req,userInfo) {
  try {
           const apiMethod = "DELETE";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }

            /// Get data from API
const reqData = await getApiRequest(req,apiMethod);
console.log(' User information ######################  reqData', reqData);
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
console.log(' User information ######################  data', data);

if (data===null) {
  console.error('Contact already added:', error);
  return returnResponse(500, `Selected data not found..`, null);
}
console.log(' User information ######################', userInfo);

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
async function getLeadType(req,userInfo) {
  try {
           const apiMethod = "GET";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }

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
  console.log('No leads found');
  return returnResponse(404, 'No leads found', null);
}

// Single row returned
const leads = data;
console.log('Contact found:', leads);
return returnResponse(200, 'Account type retrieved successfully.', leads);
}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}


/// Get  Lead type
export async function getInventories(req,userInfo) {
  try {
           const apiMethod = "GET";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }

//             `inventories(${invertoryReturnColumn},contacts(${returnContactColumn}),
//   propertyType(${['title','property_type'].join(', ')}))
// `
const { data: data1, error: error1 } = await _supabase
  .from('rUserInventories')
  .select(`inventories(${invertoryReturnColumn})`)
  .eq('is_deleted', false)
  .eq('user_id', userInfo.id)
  .eq('inventories.is_deleted', false) // Filter on contact's 'is_deleted' (if needed)
  .order('id', { ascending: false });

if (error1) {
  console.error('Error fetching joined data:', error1);
} else {
  console.log('Joined data:', data1);
}

// // Single row returned
// const leads = leadsData;
console.log('lead found:', data1);

if(data1!=null && data1.length>0){
  const inventorieList = data1.map((item) => item.inventories).filter((inventorie) => inventorie != null);
  return returnResponse(200, 'Success', inventorieList);
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
async function getContactLeads(req,userInfo) {
  try {
           const apiMethod = "GET";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }
 const reqData = await getApiRequest(req,apiMethod);
console.log('Requested mobile:', reqData);
console.log('Requested mobile >>>  :', reqData.get("contact_id"));

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
  .order('id', { ascending: true });

if (error1) {
  console.error('Error fetching joined data:', error1);
} else {
  console.log('Joined data:', data1);
}

// // Single row returned
// const leads = leadsData;
console.log('Contact found:', data1);

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
export async function getInventoryDetail(req,userInfo) {
  try {
            const apiMethod = "GET";
            const reqData = await getApiRequest(req,apiMethod);
            console.log('Requested inventory_id:', reqData);
            console.log('Requested inventory_id >>>  :', reqData.get("inventory_id"));

            if (!reqData.has("inventory_id") || reqData.get("inventory_id") === null || reqData.get("inventory_id") <= 0) {
              console.error('Please enter mandatory fields data', "error");
              return returnResponse(500, `Please enter mandatory fields data`, null);
            }
     
 const { data: leadDetail, error: error1 }  = await asyncgetInventoryDetails(reqData.get("inventory_id"));
if (error1) {
              console.error('Error fetching joined data:', error1);
              return returnResponse(500, `Not found`, null);
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
            return returnResponse(500,`Not found`,null);
 }
}

async function asyncgetLeadDetails(leadId) {
  return await _supabase
  .from('leads')
  .select(`*`)
  .eq('is_deleted', false)
  .eq('id', leadId).single();
}

async function asyncgetInventoryDetails(inventoryId) {
  return await _supabase
  .from('inventories')
  .select(`
  ${invertoryReturnColumn},
  contacts(${returnContactColumn}),
  propertyType(${['title','property_type'].join(', ')}),
  mediaFiles(${['file_url','media_type','category','sub_category','file_id','media_for'].join(', ')})
`)
  .eq('is_deleted', false)
  .eq('inventory_id', inventoryId).single();
}