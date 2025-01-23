import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders, getHeaderAuthorization,validateEndPoint,getApiRequest,getMinMaxPriceFromBudgetCode,getPriceFromString,generateUniqueIntId,validateRequredReqFields,getFilteredReqData,formatNumber} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`
import {notifyToAllFollowUps } from "../pg_notify_cron_schedule/index.js";
// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

const rangMinBudgetPer = 2;
const rangMaxBudgetPer = 2;

const leadReturnColumn = ["id","property_type","created_at","preferred_location","min_budget","purpose","additional_details","lead_type","property_size","assigne_id","max_budget",
"city","lat","lng","full_adress","amount_symbol_id","country_code","is_deleted","is_verified","asking_price","sell_type","budget_label"].join(', ');
const returnContactColumn = ['phone','first_name','last_name','contact_id','county_code'].join(', ');
const returnFollowUpColumn = ['created_at','assigned_id','follow_up_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time','follow_up_category'].join(', ');

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

 console.log(' User information ######################', userInfo);

const userData = {};

if('property_type' in reqData && 'lead_type' in reqData && 'contact_id' in reqData && 'city' in reqData &&  ('budget_code' in reqData || 'asking_price' in reqData)) {

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
console.log(' User information ###################### leadDetails >> ', leadDetails);
const leadId = leadDetails['id'];
console.log(' User information ***************** leadDetails > leadId 0 > ', leadDetails['id']);
console.log(' User information ***************** leadDetails > leadId 1 > ', leadId);
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
  if (error) {
    console.error('Failed:', error);
    return returnResponse(500, `Failed: ${error.message}`, null);
  }
}
console.log(' User information ***************** leadDetails > leadId > ', data);
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
.single();
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
async function getLeads(req,userInfo) {
  try {
           const apiMethod = "GET";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }
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
  .order('id', { ascending: false });

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
async function getLeadDetails(req,userInfo) {
  try {
           const apiMethod = "GET";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }

            const reqData = await getApiRequest(req,apiMethod);
            console.log('Requested mobile:', reqData);
            console.log('Requested mobile >>>  :', reqData.get("lead_id"));
     
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
  return await _supabase
  .from('leads')
  .select(`${leadReturnColumn},
  contacts(${returnContactColumn}),
  propertyType(${['title','property_type'].join(', ')}),
  media_files(${['file_url','media_type','category','sub_category','file_id','media_for'].join(', ')})
`)
  .eq('is_deleted', false)
  .eq('media_files.is_deleted', false)
  .eq('id', leadId).single();
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
console.log('budgetCode data >>>> ', data);
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

const localReqData = getFilteredReqData(reqData,['lead_type','property_type','search_location','city','min_budget','max_budget','sell_type','asking_price']);
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
console.log(`Logged in user :${searchLeadType}`, userInfo.id);
let query = _supabase
  .from('rUserLeads')
  .select(`
    leads (
      ${leadReturnColumn},contacts(${returnContactColumn}),
      propertyType(title, property_type),
      leadType(title, lead_type)
    )
  `)
  .eq('is_deleted', false)
  .eq('user_id', userInfo.id)
  .eq('leads.is_deleted', false)
  .eq('leads.propertyType.title', propertyType) // Correct field path
  .eq('leads.leadType.title', searchLeadType) // Correct field path
  .not('leads.leadType', 'is', null) // Exclude null leadType
  .not('leads.propertyType', 'is', null) // Exclude null propertyType
  .order('id', { ascending: false });

// Add the filter only if searchAddress has a value
if ('search_location' in localReqData) {
  query = query.ilike('leads.full_adress', `%${localReqData['search_location']}%`);
                             
}
// Add the filter only if city has a value
if ('city' in localReqData) {
  query = query.ilike('leads.city', `%${localReqData['city']}%`);
}

// Add the filter only if city has a value
if ('sell_type' in localReqData) {
  // query = query.eq('leads.sell_type', localReqData['sell_type']) // Correct field path
  // .not('leads.sell_type', 'is', null);
  query = query.ilike('leads.sell_type', `%${localReqData['sell_type']}%`);
}

// Add Price query for rental or rent case
if ('asking_price' in localReqData) {

  let askingPrice = localReqData['asking_price'];


  if(searchLeadType.toLowerCase()==="rental" || searchLeadType.toLowerCase()==="sell"){
    const difference = (askingPrice * rangMinBudgetPer) / 100;
    let lowerBoundPrice = askingPrice - difference;
    let upperBoundPrice = askingPrice + difference;
    console.log('askingPrice data >>>> min', lowerBoundPrice);
    console.log('askingPrice data >>>> max', upperBoundPrice);
    query = query.gte('leads.asking_price', lowerBoundPrice)  // follow_up_date_time >= lowerBound
    .lte('leads.asking_price', upperBoundPrice);  // follow_up_date_time <= upperBound
  }
  else  if(searchLeadType.toLowerCase()==="rent" || searchLeadType.toLowerCase()==="buy"){
    const difference = (askingPrice * rangMaxBudgetPer) / 100;
    let lowerBoundPrice = askingPrice - difference;
    let upperBoundPrice = askingPrice + difference;
    console.log('askingPrice data >>>> min', lowerBoundPrice);
    console.log('askingPrice data >>>> max', upperBoundPrice);
    query = query.gte('leads.max_budget', lowerBoundPrice)  // follow_up_date_time >= lowerBound
    .lte('leads.max_budget', upperBoundPrice);  // follow_up_date_time <= upperBound
  }
}




const { data: data1, error: error1 } = await query;

if (error1) {
  console.error('Error fetching joined data:', error1);
} else {
  console.log('Joined data:', data1);
}

// // Single row returned
// const leads = leadsData;
console.log('propertyType found: >>> ', {"propertyType":propertyType,data:data1});

if(data1!=null && data1.length>0){
  const leadList = data1.map((item) => item.leads).filter((lead) => lead != null);
  return returnResponse(200, 'Success',  {"propertyType":propertyType, "searchLeadType":searchLeadType,data:leadList} );
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

export async function addLeadFollowUp(req,userInfo){
  try
  {
/// Get data from API
const reqData = await getApiRequest(req,"POST");
console.log(' User information ######################', userInfo);

  const missingKeys = validateRequredReqFields(reqData,['lead_id','contact_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time','follow_up_category']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

      const localReqData = getFilteredReqData(reqData,['lead_id','contact_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time','follow_up_category']);
     console.log(' Add Lead followup information ###################### localReqData', localReqData);
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
     console.log(' User information ###################### leadDetails >> ', localReqData);
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
    console.log(' User information ###################### leadDetails >> ', data);
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
    return await notifyToAllFollowUps();
/// Get data from API
// const reqData = await getApiRequest(req,"POST");
// console.log(' User information ######################', userInfo);

//   const missingKeys = validateRequredReqFields(reqData,['follow_up_id']);
//   if (missingKeys['missingKeys'].length > 0) {
//     console.error('Please enter mandatory fields data', "error");
//     return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
//   }

//       const localReqData = getFilteredReqData(reqData,['follow_up_id','lead_status','lead_status_option','follow_up_remark','follow_up_date_time']);
//      const followupId =  localReqData['follow_up_id'];
//      localReqData['follow_up_id'] = followupId;
//      localReqData['user_id'] = userInfo['id'];

//      var assignId =  userInfo['id'];

//     //  return returnResponse(200, `Project details ${projectId}`,localReqData);
//       const { data, error } = await _supabase
//       .from('follow_up')
//       .update(
//         localReqData,
//       )
//       .eq('follow_up_id',followupId)
//       .eq('user_id',userInfo['id'])
//       .select(`${returnFollowUpColumn},usersProfile(${['user_id','first_name'].join(', ')})`)
//       .single();
//       if (error) {
//         console.error('Failed:', error);
//         return returnResponse(500, `Followup add Failed: ${error.message}`, null);
//       }
//     console.log(' User information ###################### leadDetails >> ', data);
//     // Add lead in user lead refrence table
//     if(!(data===null)){
//       return returnResponse(200, 'Success', data);
//     }
//     return returnResponse(500, `Failed: ${error.message}`, null);    
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
console.log(' User information ######################', userInfo);

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
    console.log(' User information ###################### leadDetails >> ', data);
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

     const localReqData = getFilteredReqData(reqData,['lead_id','follow_up_date_time']);
     console.log(' List Lead Foloup### localReqData', localReqData);

      const userId = userInfo['id'] ?? null; // Use null if undefined
      const leadId = localReqData['lead_id'] ?? null; // Use null if undefined
      
      const dateTime = localReqData['follow_up_date_time'] ?? null; // Use null if undefined
      const date = (!(dateTime===null) && !(dateTime===""))?new Date(Number(dateTime)).toISOString().split('T')[0] : null;
      // Format the date to YYYY-MM-DD
      console.log(' date only check #######', date);
      var dataList = [];
      var orQueryList = [];
      /// Return data acording to user base and lead base
      if(!(dateTime===null) && !(leadId===null)){
        const { data, error } = await _supabase
        .from('follow_up')
        .select(`${returnFollowUpColumn},usersProfile(${['user_id', 'first_name'].join(', ')}),contacts(${['first_name','last_name','phone'].join(', ')})`)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .eq('lead_id', leadId)
        .filter('follow_up_date_time', 'gte', `${date}T00:00:00.000Z`) // Start of the day
        .filter('follow_up_date_time', 'lt', `${date}T23:59:59.999Z`).order('created_at', { ascending: true });
        if (error) {
          console.error('Failed:', error);
          return returnResponse(500, `Followup add Failed: ${error.message}`, null);
        }
      // Add lead in user lead refrence table
      if(!(data===null) && (data.length>0)){
        dataList = data;
      }
      }
      else if(!(dateTime===null)) {
        // const { data, error } = await _supabase
        // .from('follow_up')
        // .select(`${returnFollowUpColumn},usersProfile(${['user_id', 'first_name'].join(', ')})`)
        // .eq('user_id', userId)
        // .eq('is_deleted', false)
        // .eq('follow_up_date_time',date);
  const { data, error } = await _supabase
  .from('follow_up')
  .select(`${returnFollowUpColumn},usersProfile(${['user_id', 'first_name'].join(', ')}),contacts(${['first_name','last_name','phone'].join(', ')})`)
  .eq('user_id', userId)
  .eq('is_deleted', false)
  .filter('follow_up_date_time', 'gte', `${date}T00:00:00.000Z`) // Start of the day
  .filter('follow_up_date_time', 'lt', `${date}T23:59:59.999Z`).order('created_at', { ascending: true }); // End of the day

        if (error) {
          console.error('Failed:', error);
          return returnResponse(500, `Followup add Failed: ${error.message}`, null);
        }
      // Add lead in user lead refrence table
      if(!(data===null) && (data.length>0)){
        dataList = data;
      }
    }

      else if(!(leadId===null)){
        const { data, error } = await _supabase
      .from('follow_up')
      .select(`${returnFollowUpColumn},usersProfile(${['user_id', 'first_name'].join(', ')}),contacts(${['first_name','last_name','phone'].join(', ')})`)
      .eq('is_deleted', false)
      .eq('user_id', userId)
      .eq('lead_id', leadId).order('created_at', { ascending: true });
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Followup add Failed: ${error.message}`, null);
      }
    // Add lead in user lead refrence table
    if(!(data===null) && (data.length>0)){
      dataList = data;
    }
    }
    else {
      const { data, error } = await _supabase
      .from('follow_up')
      .select(`${returnFollowUpColumn},usersProfile(${['user_id', 'first_name'].join(', ')}),contacts(${['first_name','last_name','phone'].join(', ')})`)
      .eq('is_deleted', false)
      .eq('user_id', userId).order('created_at', { ascending: false });
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Followup add Failed: ${error.message}`, null);
      }
    // Add lead in user lead refrence table
    if(!(data===null) && (data.length>0)){
      dataList = data;
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