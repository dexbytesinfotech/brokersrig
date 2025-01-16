import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders, getHeaderAuthorization,validateEndPoint,getApiRequest,getMinMaxPriceFromBudgetCode,getPriceFromString,generateUniqueIntId,validateRequredReqFields,getFilteredReqData,formatNumber} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);


const leadReturnColumn = ["id","created_at","preferred_location","min_budget","purpose","additional_details","lead_type","property_size","assigne_id","max_budget",
"city","lat","lng","full_adress","amount_symbol_id","country_code","is_deleted","is_verified","asking_price","sell_type","budget_label"].join(', ');
const returnContactColumn = ['phone','first_name','last_name','contact_id','county_code'].join(', ');
const returnFollowUpColumn = ['assigned_id','follow_up_id','lead_status','lead_status_option','follow_up_remark','data_time','follow_up_category'].join(', ');

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


export async function addLeadFollowUp(req,userInfo){
  try
  {
/// Get data from API
const reqData = await getApiRequest(req,"POST");
console.log(' User information ######################', userInfo);

  const missingKeys = validateRequredReqFields(reqData,['lead_id','lead_status','lead_status_option','follow_up_remark','data_time','follow_up_category']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

      const localReqData = getFilteredReqData(reqData,['lead_id','lead_status','lead_status_option','follow_up_remark','data_time','follow_up_category']);
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
     .single();
     if (leadAssigneError) {
       console.error('Failed:', leadAssigneError);
       return returnResponse(500, `Followup add Failed: ${leadAssigneError.message}`, null);
     }
     if(!(leadAssigneData===null)){
      assignId = leadAssigneData['assigned_id'];
     }
     localReqData['assigned_id'] = assignId;

    //  return returnResponse(200, `Project details ${projectId}`,localReqData);
      const { data, error } = await _supabase
      .from('follow_up')
      .insert(
        localReqData,
      )
      .select(`${returnFollowUpColumn},usersProfile(${['user_id','first_name'].join(', ')})`)
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
/// Get data from API
const reqData = await getApiRequest(req,"POST");
console.log(' User information ######################', userInfo);

  const missingKeys = validateRequredReqFields(reqData,['follow_up_id']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

      const localReqData = getFilteredReqData(reqData,['follow_up_id','lead_status','lead_status_option','follow_up_remark','data_time']);
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

      const localReqData = getFilteredReqData(reqData,['follow_up_id','lead_status','lead_status_option','follow_up_remark','data_time']);
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

export async function getLeadFollowUps(req,userInfo){
  try
  {
/// Get data from API
const reqData = await getApiRequest(req,"GET");
console.log(' User information ######################', userInfo);

  const missingKeys = validateRequredReqFields(reqData,['lead_id']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

     const localReqData = getFilteredReqData(reqData,['lead_id']);
     console.log(' Add Lead followup information ###################### localReqData', localReqData);
    //  return returnResponse(200, `Project details ${projectId}`,localReqData);
      const { data, error } = await _supabase
      .from('follow_up')
      .select(`${returnFollowUpColumn},usersProfile(${['user_id','first_name'].join(', ')})`)
      .eq('user_id',userInfo['id'])
      .eq('lead_id',localReqData['lead_id'])
      .eq('is_deleted',false);
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Followup add Failed: ${error.message}`, null);
      }
    console.log(' User information ###################### leadDetails >> ', data);
    // Add lead in user lead refrence table
    if(!(data===null) && (data.length>0)){
      return returnResponse(200, 'Success', data);
    }
    return returnResponse(200, `No data found`, null);
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}