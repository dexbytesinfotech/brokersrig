import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders, getApiRequest,getMinMaxPriceFromBudgetCode,getPriceFromString,generateUniqueIntId , isValidEmail,validateMethods} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`
import {createCustomJWT, verifyJWT } from "../jwt_auth/index.js";
import { sendEmail } from "../send_email/index.js";// Assuming this module exports `returnResponse`

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

const leadReturnColumn = ["created_at","preferred_location","min_budget","purpose","additional_details","lead_type","property_size","assigne_id","max_budget",
"city","lat","lng","full_adress","amount_symbol_id","country_code","is_deleted","is_verified","asking_price","sell_type"].join(', ');
const invertoryReturnColumn = ["created_at","preferred_location","min_budget","purpose","additional_details","lead_type","property_size","assigne_id","max_budget",
"city","lat","lng","full_adress","amount_symbol_id","country_code","is_deleted","is_verified","asking_price","sell_type","inventory_id","lead_id"].join(', ');
const returnContactColumn = ['phone','first_name','last_name','contact_id','county_code'].join(', ');



async function asyncgetUserProfile(userId) {
  const useBasicInfo = ['created_at','email','account_type','account_status','account_status_updated_by','first_name','last_name','country_code'].join(', ');
  const profileFilter = ['city','phone','photo','state','country','country_code'].join(', ');
  
    return await _supabase
    .from('users')
    .select(`
    ${useBasicInfo},
    usersProfile(${profileFilter})
    `)
    .eq('id', userId).single();
  }

// Login Function 
export async function userLogin (req){
  try {
   
/// Get data from API
const reqData = await getApiRequest(req,"POST");
if (reqData["lead_id"]<= 0) {
  return returnResponse(400,"Lead id mandatory",null);
}
    // Extract request body
    // const payload = await req.json();
    console.log('Incoming Payload:', reqData);
    
    // Extract phone_number from payload
    const { email,password,device_fcm_token} = reqData; // Ensure the payload has a property named phone_number

    // Add key that not needed in response
    const useBasicInfo = ['id','created_at','email','account_type','account_status','account_status_updated_by','first_name','last_name'].join(', ');
    
    const { data, error } = await _supabase
      .from('users')
      .select(useBasicInfo)
      .eq('email', email)
      .eq('password', password)
      .eq('is_deleted', false)
      .maybeSingle();

   console.log('Retrive data:', data);

    if (error) {
      console.error('Error checking phone number:', error);
      return returnResponse(500,`Error checking phone number: ${error.message}`,null);
    }

    // If data is found, phone number exists
    if (data!=null) {
     const userData = data;
     const userDataTemp = {id: userData.id, email: userData.email, first_name: userData.first_name};
      var authTotken = "";
      var decodedToken = "";
      try{
        authTotken = await createCustomJWT(userDataTemp);
      }
      catch (err) {
        new returnResponse(`Server error: ${err.message} ${userDataTemp}`, {
          status: 500,
        });
      }
      try{
        decodedToken = await verifyJWT(authTotken);
      }
      catch (err) {
        new returnResponse(`Server error Aouth :${authTotken} ${err.message} ${userDataTemp}`, {
          status: 500,
        });
      }
      
      userData['auth_token'] = authTotken;

try{
  /// Store device token
  const { data, error } = await _supabase
  .from('logged_in_devices')
  .insert({
    "device_fcm_token":device_fcm_token,"user_id":userData.id
  })
  .single();
  if(error){
    console.error('Failed to login ', error);
  }
}
catch(error){
  console.error('Failed to login ', err);
}

      delete userData.id;
      console.log('Phone number exists:', userData);
      return returnResponse(200,`Success`,userData);
    } 
    else {
 // Phone number does not exist
      console.log('User not Exist in db');
      return returnResponse(200,`Please enter correct login details`,null);
    }
    
  } catch (err) {
    console.error('Failed to login ', err);
    return returnResponse(500,`Server error: ${err.message}`,null);
  }
}

// Update User profile
export async function updateUserProfile(req,userInfo){
  try {

const reqData = await getApiRequest(req,"POST");

const userData = {};

if('first_name' in reqData){
  userData["first_name"] = reqData["first_name"];
}
if('last_name' in reqData){
  userData["last_name"] = reqData["last_name"];
}

if('country_code' in reqData){
  userData["country_code"] = reqData["country_code"];
}


if('country' in reqData){
  userData["country"] = reqData["country"];
}


console.log("userData >>>> 0 :", userData);

// Check if the email exists in the `users` table
if(!(JSON.stringify(userData) === '{}')){
  console.log("userData >>>> 01 :", userData);
  const { data, error } = await _supabase
  .from('users')
  .update(userData)
  .eq('id', userInfo['id'])
  .eq('is_deleted', false)
  .single();

  if (error) {
    console.error('Error checking email:', error);
    return returnResponse(500, `Error checking email: ${error.message}`, null);
  }

}
 // Check if the email exists in the `users` table
 const userProfileData = {};
 if('first_name' in reqData){
  userProfileData["first_name"] = reqData["first_name"];
}
if('last_name' in reqData){
  userProfileData["last_name"] = reqData["last_name"];
}
 if('city' in reqData){
  userProfileData["city"] = reqData["city"];
 }
 if('country_code' in reqData){
  userProfileData["country_code"] = reqData["country_code"];
}
if('country' in reqData){
  userProfileData["country"] = reqData["country"];
}
 if('phone' in reqData){
  userProfileData["phone"] = reqData["phone"];
 }
 if('photo' in reqData){
  userProfileData["photo"] = reqData["photo"];
 }

 console.log("userInfo userProfileData >>>> :", userProfileData);

 // Check if the email exists in the `users` table
 if(!(JSON.stringify(userProfileData) === '{}')){
    const { data, error } = await _supabase
    .from('usersProfile')
    .update(userProfileData)
    .eq('user_id', userInfo['id'])
    .single();
    if (error) {
      console.error('Error checking email:', error);
      return returnResponse(500, `Error checking email: ${error.message}`, null);
    }
  }

/// Get profile data
// Check if the email exists in the `users` table
const { data, error } = await asyncgetUserProfile(userInfo['id']);
if (error) {
console.error('Error checking email:', error);
return returnResponse(500, `Error checking email: ${error.message}`, null);
}
return returnResponse(200, `Success`, data);

} catch (err) {
console.error('Server error:', err);
return returnResponse(500,`User not exist`,null);
}
}


export async function forgotPassword(req){
  try {
const reqData = await getApiRequest(req,"POST");

console.log("userInfo >>>> :", reqData);
if(!('email' in reqData) || !isValidEmail(reqData["email"])){
  return returnResponse(400,JSON.stringify({ error: "Please enter valid email"}),null);
}

const tempOtp = "1234";

const useBasicInfo = ['id','email','first_name','last_name'].join(', ');

const profileFilter = ['city','phone','photo','state','country'].join(', ');

const userData = {"otp":tempOtp};
var id ;

try{
const { data, error } = await _supabase
.from('users')
.select(useBasicInfo)
.eq('email', reqData['email'])
.eq('is_deleted', false)
.single();

if (error) {
  console.error('Error checking email:', error);
  return returnResponse(500, `Email not found: ${error.message}`, null);
}
const subject = `Otp for varification`;
console.error('User Details', data);
const body = `Please find your OTP ${tempOtp}`;
const status = await sendEmail({"to":data['email'],"subject":subject,"body":body,"name":data['first_name']});

// if (status===null) {
//   console.error('Error checking email:', "errorTemp");
//   return returnResponse(500, `Email send failed`, null);
// }
id = data['id'];
}
catch (err) {

}
  const { data, error } = await _supabase
  .from('users')
  .update(userData)
  .eq('id', id)
  .eq('is_deleted', false)
  .single();

  if (error) {
    console.error('Error checking email:', error);
    return returnResponse(500, `Email not found: ${error.message}`, null);
  }
 
 console.log("userInfo userProfileData >>>> :", data);

return returnResponse(200, `Otp send syccessfully on email`,null);

} catch (err) {
console.error('Server error:', err);
return returnResponse(500,`User not exist`,null);
}
}

export async function getProfile(req,userInfo){
  try {
    const { data, error } = await _supabase
    .from('users')
    .select('*')
    .eq('id', userInfo['id'])
    .eq('is_deleted', false)
    .single();
  
    if (error) {
      console.error('Error checking email:', error);
      return returnResponse(500, `Email not found: ${error.message}`, null);
    }
    if (data === null) {
      return returnResponse(500, `Data not found!`, null);
    }   
/// Get profile data
// Check if the email exists in the `users` table
const { data:userData, error:error1 } = await asyncgetUserProfile(userInfo['id']);
if (error1) {
console.error('Error checking email:', error1);
return returnResponse(500, `Error checking email: ${error1.message}`, null);
}
return returnResponse(200, `Success`, userData);
} catch (err) {
  console.error('Server error:', err);
  return returnResponse(500,`User not exist`,null);
  }
}


export async function setPassword(req){
  try {

const reqData = await getApiRequest(req,"POST");

console.log("userInfo >>>> :", reqData);
if((!('email' in reqData) || !isValidEmail(reqData["email"]) || (!('otp' in reqData) || reqData["otp"].length<4))  || (!('password' in reqData) || reqData["password"].length<4)){
  return returnResponse(400,JSON.stringify({ error: "Please enter valid email and OTP "}),null);
}

const useBasicInfo = ['id','email','first_name','last_name'].join(', ');
var id ;

try{
const { data, error } = await _supabase
.from('users')
.select(useBasicInfo)
.eq('email', reqData['email'])
.eq('otp', reqData['otp'])
.eq('is_deleted', false)
.single();

if (error) {
  console.error('Error checking email:', error);
  return returnResponse(500, `Email not found: ${error.message}`, null);
}
const subject = `Otp for varification`;
console.error('User Details', data);
const body = `Password updated successfully`;
const status = await sendEmail({"to":data['email'],"subject":subject,"body":body,"name":data['first_name']});

id = data['id'];
}
catch (err) {
 console.error('Error checking email:', "errorTemp");
  return returnResponse(500, `Invalid information`, null);
}
//// Updated user information
  const userData = {"password":reqData["password"],"otp":null};
  const { data, error } = await _supabase
  .from('users')
  .update(userData)
  .eq('id', id)
  .eq('is_deleted', false)
  .single();
  if (error) {
    console.error('Error checking email:', error);
    return returnResponse(500, `Email not found: ${error.message}`, null);
  }
 console.log("userInfo userProfileData >>>> :", data);
return returnResponse(200, `Password changed successfully`,null);
} catch (err) {
console.error('Server error:', err);
return returnResponse(500,`User not exist`,null);
}
}

export async function changePassword(req,userInfo){
  try {
const reqData = await getApiRequest(req,"POST");
console.log("userInfo >>>> :", reqData);
if((!('email' in reqData) || !isValidEmail(reqData["email"]) || (!('password' in reqData) || reqData["password"].length<4)|| (!('old_password' in reqData) || reqData["old_password"].length<4))  || (!('password' in reqData) || reqData["password"].length<4)){
  return returnResponse(400,JSON.stringify({ error: "Please enter valid email and old password "}),null);
}
const useBasicInfo = ['id','email','first_name','last_name'].join(', ');
const { data:data1, error:error1 } = await _supabase
.from('users')
.select(useBasicInfo)
.eq('email', reqData['email'])
.eq('password', reqData['old_password'])
.eq('is_deleted', false)
.single();

if (error1) {
  console.error('Error checking email:', error1);
  return returnResponse(500, `Detail not `, null);
}
console.error('User Details', data1);
//// Updated user information
  const userData = {"password":reqData["password"]};
  const { data, error } = await _supabase
  .from('users')
  .update(userData)
  .eq('email', reqData['email'])
  .eq('is_deleted', false)
  .single();
  if (error) {
    console.error('Error checking email:', error);
    return returnResponse(500, `${error.message}`, null);
  }
 console.log("userInfo userProfileData >>>> :", data);
return returnResponse(200, `Password changed successfully`,null);
} catch (err) {
console.error('Server error:', err);
return returnResponse(500,`User not exist`,null);
}
}

export async function deleteAccount(req,userInfo){
  try {
const reqData = await getApiRequest(req,"DELETE");

console.log("userInfo >>>> :", reqData);
if(!('email' in reqData) || !isValidEmail(reqData["email"])){
  return returnResponse(400,JSON.stringify({ error: "Please enter valid email and OTP "}),null);
}

const { data:data1, error:error1 } = await _supabase
  .from('users')
  .update({"is_deleted":true})
  .eq('email', reqData['email'])
  .maybeSingle();

if (error1) {
  console.error('Error checking email:', error1);
  return returnResponse(500, `Detail not `, null);
}
 console.log("userInfo userProfileData >>>> :", data1);
return returnResponse(200, `Account deleted successfully`,null);
} catch (err) {
console.error('Server error:', err);
return returnResponse(500,`User not exist`,null);
}
}

export async function registerUser(req){
  try {

    /// Get data from API
const reqData = await getApiRequest(req,"POST");
if (reqData["lead_id"]<= 0) {
  return returnResponse(400,"Lead id mandatory",null);
}
    // Extract request body
    // const payload = await req.json();
    console.log('Incoming Payload:', reqData);
    // Extract details from payload
    const { email, password, first_name, last_name, account_type } = reqData;

    const selectedColumns = ['created_at','email','account_type','account_status','account_status_updated_by','first_name','last_name'].join(', ');
    // Check if the email exists in the `users` table
    const { data, error } = await _supabase
      .from('users')
      .select(selectedColumns)
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error checking email:', error);
      return returnResponse(500, `Error checking email: ${error.message}`, null);
    }

    // If data is found, email already exists
    if (data != null) {
      console.log('Email already exists:', data);
      return returnResponse(200, `User already exists`, null);
    }

    // Insert data into the `users` table
    const { data: userData, error: insertError } = await _supabase
      .from('users')
      .insert([
        {
          email: email,
          password: password,
          account_type: account_type,
          first_name: first_name,
          last_name: last_name,
        },
      ])
      .select();

    if (insertError) {
      console.error('Error inserting user:', insertError);
      return new Response(`Error inserting user: ${insertError.message}`, {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('User registered successfully');
    const userId = userData[0].id;

    // Insert data into the `usersProfile` table
    const { data: profileData, error: profileInsertError } = await _supabase
      .from('usersProfile')
      .insert([
        {
          user_id: userId,
          first_name: first_name,
          last_name: last_name,
        },
      ])
      .select();

    if (profileInsertError) {
      console.error('Error inserting user profile:', profileInsertError);
      return new Response(
        `Error inserting user profile: ${profileInsertError.message}`,
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    return returnResponse(201, `User registered successfully`, userData);
  }
  catch (err) {
    console.error('Server error:', err);
    return returnResponse(500,`User not exist`,null);
    }
}


/// Add User busines card
export async function manageUserBusinessCard(req,userInfo,action){
  try {
var method = "POST";

/// Get Card information
if(action.toLowerCase()==="getdetail"){
  const { data, error } = await _supabase
    .from('usersProfile')
    .select('business_card_details')
    .eq('user_id', userInfo['id'])
    .single();
    if (error) {
      console.error('Error checking email:', error);
      return returnResponse(500, `Error checking email: ${error.message}`, null);
    }
    if (error) {
console.error('Error checking email:', error);
return returnResponse(500, `Error checking email: ${error.message}`, null);
}
return returnResponse(200, `Success`, data['business_card_details']===null?{}:JSON.parse(data['business_card_details']));
}

else if(action.toLowerCase()==="deletecard"){
  method = "DELETE"; 
}

const userData = {};
if(action.toLowerCase()==="add" || action.toLowerCase()==="update"){
  console.log("method >>>> 0 :", method);
  const reqData = await getApiRequest(req,method);
  console.log("userData >>>> 0 :", reqData);
  // if('business_card_details' in reqData){
  //   userData["business_card_details"] = JSON.stringify(reqData["business_card_details"]);
  // }
  if(reqData.length<=0){
    return returnResponse(500, `Data requred`, null);
  }

  userData["business_card_details"] = JSON.stringify(reqData);

}
else{
  userData["business_card_details"] = null;
}
const { data, error } = await _supabase
    .from('usersProfile')
    .update(userData)
    .eq('user_id', userInfo['id'])
    .select('business_card_details').single();
    if (error) {
      console.error('Error checking email:', error);
      return returnResponse(500, `Error checking email: ${error.message}`, null);
    }
    if (error) {
console.error('Error checking email:', error);
return returnResponse(500, `Error checking email: ${error.message}`, null);
}

if(action.toLowerCase()==="deletecard"){
return returnResponse(200, `Deleted successfully`, {});
}
else{
  return returnResponse(200, `Success`, JSON.parse(data['business_card_details']));
}


} catch (err) {
console.error('Server error:', err);
return returnResponse(500,`Server error`,err);
}
}