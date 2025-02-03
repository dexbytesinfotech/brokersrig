import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders, getHeaderAuthorization, getApiRequest,validateEndPoint } from "../validate_functions/index.js";// Assuming this module exports `returnResponse`
import {verifyJWT } from "../jwt_auth/index.js";

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

serve(async (req) => {
  try {
         const url = new URL(req.url);
         console.log("called API >>>> :", url);
    // Handle OPTIONS Preflight Request
    if (req.method === "OPTIONS") {
      console.log("called API >>>> OPTIONS in:", url);
      return new Response(null, {
        status: 204, // No Content response
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow all domains
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }
            // Validate headers and method
  const validateError = validateEndPoint(req,['/property/get_property_type','/property/add_lead','/property/update_lead','/property/delete_lead','/property/get_leads']);

  if (validateError===null) {
    return returnResponse(400,JSON.stringify({ error: "Validation failed", details: validateError }),null);
  }
  
  const authToken = getHeaderAuthorization(req.headers);

  const userInfo = await verifyJWT(authToken);
  if (userInfo===null) {
    return returnResponse(400,JSON.stringify({ error: "Unexpected token"}),null);
  }

  /// add leads
  if(validateError==="/property/get_property_type"){
    return await getPropertyType(req,userInfo);
   }
   else if(validateError==="/lead/get_leads"){
    return await getLeads(req,userInfo);
   }
  else if(validateError==="/lead/add_lead"){
   return await addLead(req,userInfo);
  }
  else if(validateError==="/lead/update_lead"){
    return await updateLead(req,userInfo);
   }
   else if(validateError==="/lead/delete_lead"){
    return await deleteLead(req,userInfo);
   }

  return returnResponse(400,JSON.stringify({ error: "Validation failed", details: validateError }),null);

  } 
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`User not exist`,null);
  }
});


// Add lead
async function addLead(req,userInfo) {
  try {
           const apiMethod = "POST";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }

            /// Get data from API
const reqData = await getApiRequest(req,apiMethod);

if (reqData["id"]<= 0) {
  return returnResponse(400,JSON.stringify({ error: "Unathoried user"}),null);
}

 console.log(' User information ######################', userInfo);

const userData = {};

if('property_type' in reqData && 'lead_type_id' in reqData && 'contact_id' in reqData && 'city' in reqData && ('min_budget' in reqData || 'max_budget' in reqData)) {

  // userData['user_id'] = userInfo['id'];

  userData["property_type"] = reqData["property_type"];
  userData["lead_type_id"] = reqData["lead_type_id"];
  userData["contact_id"] = reqData["contact_id"];
  userData["city"] = reqData["city"];


  if('additional_details' in reqData){
  userData["additional_details"] = reqData["additional_details"];
  }

  if('property_size' in reqData){
  userData["property_size"] = reqData["property_size"];
  }

  if('min_budget' in reqData){
  userData["min_budget"] = reqData["min_budget"];
  }

  if('max_budget' in reqData){
  userData["max_budget"] = reqData["max_budget"];
  }
  
  if('lat' in reqData){
  userData["lat"] = reqData["lat"];
  }
  
  if('lng' in reqData){
  userData["lng"] = reqData["lng"];
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
  .insert(
    userData,
  )
  .select()
  .single();
  if (error) {
    console.error('Failed:', error);
    return returnResponse(500, `Failed: ${error.message}`, null);
  }
const leadDetails = data;
console.log(' User information ###################### leadDetails', leadDetails);
// Add lead in user lead refrence table
if(!(leadDetails===null)){
  const { data, error } = await _supabase
  .from('rUserLeads')
  .insert([
    {
      "user_id": userInfo['id'],
      "lead_id": leadDetails['id']
    },
  ])
  .select()
  .single();
  if (error) {
    console.error('Failed:', error);
    return returnResponse(500, `Failed: ${error.message}`, null);
  }
}

return returnResponse(200, `Lead created successfully`, leadDetails); 
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

if('lead_id' in reqData && ('min_budget' in reqData || 'max_budget' in reqData)) {

// userData['user_id'] = userInfo['id'];
if('property_type' in reqData){
userData["property_type"] = reqData["property_type"];
}
if('lead_type_id' in reqData){
userData["lead_type_id"] = reqData["lead_type_id"];
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

if('min_budget' in reqData){
userData["min_budget"] = reqData["min_budget"];
}

if('max_budget' in reqData){
userData["max_budget"] = reqData["max_budget"];
}

if('lat' in reqData){
userData["lat"] = reqData["lat"];
}

if('lng' in reqData){
userData["lng"] = reqData["lng"];
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
.select()
.single();
if (error) {
console.error('Failed:', error);
return returnResponse(500, `Failed: ${error.message}`, null);
}
const leadDetails = data;
console.log(' User information ###################### leadDetails', leadDetails);
// Add lead in user lead refrence table
if(!(leadDetails===null)){
const { data, error } = await _supabase
.from('rUserLeads')
.insert([
{
"user_id": userInfo['id'],
"lead_id": leadDetails['id']
},
])
.select()
.single();
if (error) {
console.error('Failed:', error);
return returnResponse(500, `Failed: ${error.message}`, null);
}
}

return returnResponse(200, `Lead created successfully`, leadDetails); 
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

  const { data: updateData, error: updateError } = await _supabase
  .from('leads')
  .update([
    userData,
  ])
  .eq('id', reqData["lead_id"])
  .select();

  if (error) {
    console.error('Failed:', error);
    return returnResponse(500, `Failed: ${error.message}`, null);
  }
const leadDetails = data;
try{
  delete leadDetails.id;
delete leadDetails.user_id;
}
catch (err) {

}
return returnResponse(200, `Deleted successfully`, leadDetails); 
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
async function getPropertyType(req,userInfo) {
  try {
           const apiMethod = "GET";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }

const returnColumn = ['property_type','created_at','title'].join(', ');
// Check if the email exists in the `users` table
const { data, error } = await _supabase
  .from('propertyType')
  .select(returnColumn).eq("is_deleted",false).order('id', { ascending: true });

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
console.log('Contact found: >>>', leads);
return returnResponse(200, 'Account type retrieved successfully.', leads);
}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}


/// Get  Lead type
async function getLeads(req,userInfo) {
  try {
           const apiMethod = "GET";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }

const returnColumn = ['id','created_at','lead_id'].join(', ');

// const { data:data1, error:error1 } = await _supabase
//   .from('rUserLeads')
//   .select('*')
//   .eq('is_deleted', false)
//   .eq('user_id', userInfo.id).select();

const { data: data1, error: error1 } = await _supabase
  .from('rUserLeads')
  .select(`
    *,
    leads(*)
  `)
  .eq('is_deleted', false)
  .eq('user_id', userInfo.id)
  .eq('leads.is_deleted', false);

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