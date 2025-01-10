import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders,getApiRequest,validateEndPoint,getMinMaxPriceFromBudgetCode,formatNumber,getPriceFromString } from "../validate_functions/index.js";// Assuming this module exports `returnResponse`
import {verifyJWT } from "../jwt_auth/index.js";
import {pulishInvertory,getInventories,getInventoryDetail} from "../inventory/index.js";
import {getPriceRange,addMediaFile,deleteMediaFile} from "../mobile_app_config/index.js";

import {userLogin,updateUserProfile,forgotPassword,getProfile,setPassword,changePassword,deleteAccount,registerUser,manageUserBusinessCard} from "../user/index.js";



// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

serve(async (req) => {
  try {
         const url = new URL(req.url);
         console.log("called API >>>> :", url);
///,['/lead/get_lead_type','/lead/add_lead','/lead/update_lead','/lead/delete_lead','/lead/get_leads','/lead/lead_details','/lead/get_contacts_leads']
            // Validate headers and method
  const validateEndPoint = getValidateEndPoint(req);
  if (validateEndPoint===null) {
    return returnResponse(400,validateEndPoint,null);
  }

  const validateAllowedMethodErrors = validateAllowedMethods(req);
  if (!(validateAllowedMethodErrors.length === 0)) {
    return returnResponse(400,validateAllowedMethodErrors,null);
  }

  
  /// Publish invertory
  if(validateEndPoint==="/inventory/publish" && validateSingleApiMethods('POST',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await pulishInvertory(req,userInfo);
   }

   else if(validateEndPoint==="/inventory/getInventories" && validateSingleApiMethods('GET',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await getInventories(req,userInfo);
   }

   else if(validateEndPoint==="/inventory/getInventoryDetail" && validateSingleApiMethods('GET',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await getInventoryDetail(req,userInfo);
   }

   else if(validateEndPoint==="/media/add_media" && validateSingleApiMethods('POST',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await addMediaFile(req,userInfo);
   }

   else if(validateEndPoint==="/media/delete_media" && validateSingleApiMethods('DELETE',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await deleteMediaFile(req,userInfo);
   }

   

   else if(validateEndPoint==="/update_user_profile" && validateSingleApiMethods('POST',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await updateUserProfile(req,userInfo);
   }

   else if(validateEndPoint==="/get_user_profile" && validateSingleApiMethods('POST',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await getProfile(req,userInfo);
   }

   else if(validateEndPoint==="/add_business_card" && validateSingleApiMethods('POST',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await manageUserBusinessCard(req,userInfo,"add");
   }
   else if(validateEndPoint==="/update_business_card" && validateSingleApiMethods('POST',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await manageUserBusinessCard(req,userInfo,"update");
   }

   else if(validateEndPoint==="/get_business_card" && validateSingleApiMethods('GET',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await manageUserBusinessCard(req,userInfo,"getDetail");
   }

   else if(validateEndPoint==="/delete_business_card" && validateSingleApiMethods('DELETE',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await manageUserBusinessCard(req,userInfo,"deleteCard");
   }




   else if(validateEndPoint==="/mobile_app_config/get_price_range" && validateSingleApiMethods('GET',req.headers).length===0){
    return await getPriceRange(req);
   }
   else if(validateEndPoint==="/user_login" && validateSingleApiMethods('POST',req.headers).length===0){
    return await userLogin(req);
   }
   else if(validateEndPoint==="/set_password" && validateSingleApiMethods('POST',req.headers).length===0){
    return await setPassword(req);
   }
   else if(validateEndPoint==="/forgot_password" && validateSingleApiMethods('POST',req.headers).length===0){
    return await forgotPassword(req);
   }
   else if(validateEndPoint==="/register_user" && validateSingleApiMethods('POST',req.headers).length===0){
    return await registerUser(req);
   }

   
   



   else if(validateEndPoint==="/change_password" && validateSingleApiMethods('POST',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await changePassword(req,userInfo);
   }
   
   else if(validateEndPoint==="/delete_account" && validateSingleApiMethods('DELETE',req.headers).length===0){
    const userInfo = await validateUserAuthorization(req);
    if (userInfo===null) {
      return returnResponse(400,"Unexpected token",null);
    }
    return await deleteAccount(req,userInfo);
   }
   
   




  return returnResponse(400,"Invalid HTTP method.",null);
  } 
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server error: new ${err}`,null);
  }
});



// Check APi is correct
function getValidateEndPoint(req) {
  var result = null;
  const url = new URL(req.url);
  const pathName = url.pathname;
console.log("pathName >>************ * * pathName >> 1111 :", pathName);
if (pathName.startsWith("/api/")) {
  const path = pathName.slice(4); // Remove "/api" part
  console.log("pathName >>************ * * pathName >> 22222 :", path);
  if(path.length>1 && path.startsWith("/")){
    result = path;
  }
}
console.log("pathName >>************ * * pathName >> 3333 :", result);
return result;
}

  // Check Authorization header
function getHeaderAuthorization(headers) {
  const authorization = headers.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.split(" ")[1];
  }
  else {
    return null;
  }
}

  // Check Authorization user by header auth token
  async function validateUserAuthorization(req) {
    try{
      const headers = req.headers;
      const authorization = headers.get("authorization");
    if (authorization && authorization.startsWith("Bearer ")) {
      const authToken = authorization.split(" ")[1];
      const userInfo = await verifyJWT(authToken)
      return userInfo;
    }
    else {
      return null;
    }
    }
    catch(error){
      return null;
    }
  }

  function validateAllowedMethods(req) {
    const headers = req.headers;
    const method = req.method;
    const errors = [];
    console.log("method >>************ * * >> 0000 :", method);
    // Validate HTTP method
    if (!["post", "get","delete"].includes(method.toLowerCase())) {
      console.log("userInfo >>************ * * >> 0000 :", method);
      errors.push(`Invalid HTTP method. Expected 'POST' or 'GET', but received '${method}'.`);
    }
  
    // Check Content-Type header
    const contentType = headers.get("content-type");
    if (!contentType || !["application/json", "application/json; charset=utf-8"].includes(contentType)) {
      console.log("userInfo >>************ * * >> 1111000 :", contentType);
      errors.push("Invalid or missing Content-Type. Expected 'application/json'.");
    }
    // Add additional header validations if necessary
    return errors;
  }

  function validateSingleApiMethods(method,headers) {
    const errors = [];
    // Validate HTTP method
    if (!["post", "get","delete"].includes(method.toLowerCase())) {
      console.log("userInfo >>************ * * >> 0000 :", method);
      errors.push(`Invalid HTTP method. Expected 'POST' or 'GET', but received '${method}'.`);
    }
    // Check Content-Type header
    const contentType = headers.get("content-type");
    if (!contentType || !["application/json", "application/json; charset=utf-8"].includes(contentType)) {
      console.log("userInfo >>************ * * >> 1111000 :", contentType);
      errors.push("Invalid or missing Content-Type. Expected 'application/json'.");
    }
  
    // Add additional header validations if necessary
    return errors;
  }