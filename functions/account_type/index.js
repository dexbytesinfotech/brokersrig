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

            // Validate headers and method
  const validateError = validateEndPoint(req,['/account_type/get_account_type']);

  if (validateError===null) {
    return returnResponse(400,JSON.stringify({ error: "Validation failed", details: validateError }),null);
  }
  
  const authToken = getHeaderAuthorization(req.headers);

  const userInfo = await verifyJWT(authToken);
  if (userInfo===null) {
    return returnResponse(400,JSON.stringify({ error: "Unexpected token"}),null);
  }

  /// add contact
  if(validateError==="/account_type/get_account_type"){
    return await getAcountType(req,userInfo);
   }
  // else if(validateError==="/account_type/get_account_type"){
  //  return await addContact(req,userInfo);
  // }
  // else if(validateError==="/contact/update"){
  //   return await updateContact(req,userInfo);
  //  }
  //  else if(validateError==="/contact/delete"){
  //   return await deleteContact(req,userInfo);
  //  }

  return returnResponse(400,JSON.stringify({ error: "Validation failed", details: validateError }),null);

  } 
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`User not exist`,null);
  }
});


async function addContact(req,userInfo) {
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

// Check if the email exists in the `users` table
const { data, error } = await _supabase
.from('contacts')
.select('*')
.eq('user_id', userInfo['id'])
.eq('phone',reqData['phone'])
.maybeSingle();
if (error) {
  console.error('Error checking contact:', error);
  return returnResponse(500, `Error checking email: ${error.message}`, null);
}

console.log(' User information ######################  data', data);

if (!(data===null)) {
  console.error('Contact already added:', error);
  return returnResponse(500, `Contact already added..`, null);
}
 console.log(' User information ######################', userInfo);

const userData = {};
    
if('first_name' in reqData && 'last_name' in reqData && 'phone' in reqData && 'account_type' in reqData){

  userData['user_id'] = userInfo['id'];

  userData["first_name"] = reqData["first_name"];
  userData["last_name"] = reqData["last_name"];
  userData["phone"] = reqData["phone"];
  userData["account_type"] = reqData["account_type"];
  //Optional fields
  if('whatsapp_number' in reqData){
    userData["whatsapp_number"] = reqData["whatsapp_number"];
  }
}
console.log(' User information ###################### userData', userData);
// Check if the email exists in the `users` table
if(!(JSON.stringify(userData) === '{}')){
  const { data, error } = await _supabase
  .from('contacts')
  .insert([
    userData,
  ])
  .select();
  if (error) {
    console.error('Failed:', error);
    return returnResponse(500, `Failed: ${error.message}`, null);
  }
const contactDetails = data;
try{
  delete contactDetails.id;
delete contactDetails.user_id;
}
catch (err) {

}
return returnResponse(200, `Added successfully`, contactDetails); 
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



async function updateContact(req,userInfo) {
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
  return returnResponse(400,"Unathoried user",null);
}

if(!('contact_id' in reqData) ||  reqData["contact_id"]===null){
  return returnResponse(400,"Contact id Reqired",null);
}
// Check if the email exists in the `users` table
const { data, error } = await _supabase
.from('contacts')
.select('*')
.eq('id',reqData["contact_id"])
.maybeSingle();
if (error) {
  console.error('Error checking contact:', error);
  return returnResponse(500, `Error checking email: ${error.message}`, null);
}
console.log(' User information ######################  data', data);

if (data===null) {
  console.error('Contact already added:', error);
  return returnResponse(500, `Selected data not found..`, null);
}
 console.log(' User information ######################', userInfo);

const userData = {};

if('first_name' in reqData){
  userData["first_name"] = reqData["first_name"];
}
if('last_name' in reqData){
  userData["last_name"] = reqData["last_name"];
}

if('account_type' in reqData){
  userData["account_type"] = reqData["account_type"];
}
if('whatsapp_number' in reqData){
  userData["whatsapp_number"] = reqData["whatsapp_number"];
}

// Check if the email exists in the `users` table
if(!(JSON.stringify(userData) === '{}')){
  const { data, error } = await _supabase
  .from('contacts')
  .update([
    userData,
  ])
  .eq('id', reqData["contact_id"])
  .select();
  if (error) {
    console.error('Failed:', error);
    return returnResponse(500, `Failed: ${error.message}`, null);
  }
const contactDetails = data;
try{
  delete contactDetails.id;
delete contactDetails.user_id;
}
catch (err) {

}
return returnResponse(200, `Updated successfully`, contactDetails); 
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



/// Delete contact
async function deleteContact(req,userInfo) {
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

if(!('contact_id' in reqData) ||  reqData["contact_id"]===null){
  return returnResponse(400,"Contact id Reqired",null);
}
// Check if the email exists in the `users` table
const { data, error } = await _supabase
.from('contacts')
.select('*')
.eq('id',reqData["contact_id"])
.eq('is_deleted',false)
.maybeSingle();
if (error) {
  console.error('Error checking contact:', error);
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
  .from('contacts')
  .update([
    userData,
  ])
  .eq('id', reqData["contact_id"])
  .select();
  if (error) {
    console.error('Failed:', error);
    return returnResponse(500, `Failed: ${error.message}`, null);
  }
const contactDetails = data;
try{
  delete contactDetails.id;
delete contactDetails.user_id;
}
catch (err) {

}
return returnResponse(200, `Deleted successfully`, contactDetails); 
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

/// Delete contact
async function getAcountType(req,userInfo) {
  try {
           const apiMethod = "GET";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }

const returnColumn = ['account_type','created_at','account_name'].join(', ');
// Check if the email exists in the `users` table
const { data, error } = await _supabase
  .from('accountType')
  .select(returnColumn).eq("is_deleted",false);

if (error) {
  console.error('Error checking contact:', error);
  return returnResponse(500, `Error checking contact: ${error.message}`, null);
}

// Check for multiple rows and handle accordingly
if (!data || data.length === 0) {
  console.log('No contact found');
  return returnResponse(404, 'No contact found', null);
}

// Single row returned
const contact = data;
console.log('Contact found:', contact);
return returnResponse(200, 'Account type retrieved successfully.', contact);
}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}