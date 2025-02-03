import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders,getApiRequest,validateEndPoint,getMinMaxPriceFromBudgetCode,formatNumber,getPriceFromString } from "../validate_functions/index.js";// Assuming this module exports `returnResponse`
import {verifyJWT } from "../jwt_auth/index.js";
import {pulishInvertory,getInventories,getInventoryDetail,addListingAdditionalDetails,getListingAdditionalDetails} from "../inventory/index.js";
import {getPriceRange,addMediaFile,deleteMediaFile} from "../mobile_app_config/index.js";

import {getDevelopers,addDeveloper} from "../developers/index.js";
import {addLeadFollowUp,getLeadAllFollowUps,getLeadFollowUpDetail,updateLeadFollowUp,getMatchedLeads,  getLeadType,addLead,updateLead,deleteLead,getLeads,getLeadDetails,getContactLeads} from "../leads/index.js";

import {addProject,addListing,getAllProjects,getProjectListing,addPaymentTerms,getProjectDetail,addProjectAdditionalDetails,addProjectMediaFile,deleteProjectMediaFile} from "../project/index.js";

import {userLogin,updateUserProfile,forgotPassword,getProfile,setPassword,changePassword,deleteAccount,registerUser,manageUserBusinessCard} from "../user/index.js";

import {addContact,updateContact,deleteContact,getContacts,getAllContacts,getValidedContact,getAcountType} from "../contact_api/index.js";

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

  const validateEndPoint = getValidateEndPoint(req);
  if (validateEndPoint===null) {
    return returnResponse(400,validateEndPoint,null);
  }

  const validateAllowedMethodErrors = validateAllowedMethods(req);
  if (!(validateAllowedMethodErrors.length === 0)) {
    return returnResponse(400,validateAllowedMethodErrors,null);
  }



const apiMappings = {
  "/inventory/publish": { method: "POST", handler: pulishInvertory },
  "/listing/add_additional_detail": { method: "POST", handler: addListingAdditionalDetails},
  "/listing/additional_detail": { method: "GET", handler: getListingAdditionalDetails},
  "/inventory/getInventories": { method: "GET", handler: getInventories},
  "/inventory/getInventoryDetail": { method: "GET", handler: getInventoryDetail},
  "/media/add_media": { method: "POST", handler: addMediaFile},
  "/media/delete_media": { method: "DELETE", handler: deleteMediaFile},
  "/update_user_profile": { method: "POST", handler: updateUserProfile},
  "/get_user_profile": { method: "POST", handler: getProfile},
  "/add_business_card": { method: "POST", handler: manageUserBusinessCard,subAction: "add"},
  "/update_business_card": { method: "POST", handler: manageUserBusinessCard,subAction: "update"},
  "/get_business_card": { method: "GET", handler: manageUserBusinessCard,subAction: "getDetail"},
  "/delete_business_card": { method: "DELETE", handler: manageUserBusinessCard,subAction: "deleteCard"},
  "/change_password": { method: "POST", handler: changePassword},
  "/delete_account": { method: "DELETE", handler: deleteAccount},
  "/project/add": { method: "POST", handler: returnResponse},
  "/project/add_listing": { method: "POST", handler: addListing},
  "/project/get_listing": { method: "POST", handler: getProjectListing},
  "/project/get_projects": { method: "POST", handler: getAllProjects},
  "/project/add_payment_terms": { method: "POST", handler: addPaymentTerms},
  "/project/add_project_additional_details": { method: "POST", handler: addProjectAdditionalDetails},
  "/project/add_project_media": { method: "POST", handler: addProjectMediaFile},
  "/project/delet_project_media": { method: "DELETE", handler: deleteProjectMediaFile},
  "/project/project_details": { method: "GET", handler: getProjectDetail},
  "/developer/add": { method: "POST", handler: addDeveloper,validateUser:false},
  "/developer/get_developers": { method: "GET", handler: getDevelopers,validateUser:false},
  "/lead/add_follow_up": { method: "POST", handler: addLeadFollowUp},
  "/lead/update_follow_up": { method: "POST", handler: updateLeadFollowUp},
  "/lead/get_all_follow_up": { method: "GET", handler: getLeadAllFollowUps},
  "/lead/get_lead_type": { method: "GET", handler: getLeadType},
  "/lead/add_lead": { method: "POST", handler: addLead},
  "/lead/update_lead": { method: "POST", handler: updateLead},
  "/lead/delete_lead": { method: "DELETE", handler: deleteLead},
  "/lead/get_leads": { method: "GET", handler: getLeads},
  "/lead/lead_details": { method: "GET", handler: getLeadDetails},
  "/lead/get_contacts_leads": { method: "GET", handler: getContactLeads},
  "/lead/get_follow_up_details": { method: "GET", handler: getLeadFollowUpDetail},
  "/lead/get_matched_leads": { method: "GET", handler: getMatchedLeads},

  "/contact/add": { method: "POST", handler: addContact},
  "/contact/update": { method: "POST", handler: updateContact},
  "/contact/delete": { method: "DELETE", handler: deleteContact},
  "/contact/get_contacts": { method: "GET", handler: getContacts},
  "/contact/get_all_contacts": { method: "GET", handler: getAllContacts},
  "/contact/is_valid_contact": { method: "GET", handler: getValidedContact},
  "/account_type/get_account_type": { method: "GET", handler: getAcountType},

  "/mobile_app_config/get_price_range": { method: "GET", handler: getPriceRange,validateUser:false},
  "/user_login": { method: "POST", handler: userLogin,validateUser:false},
  "/set_password": { method: "POST", handler: setPassword,validateUser:false},
  "/forgot_password": { method: "POST", handler: forgotPassword,validateUser:false},
  "/register_user": { method: "POST", handler: registerUser,validateUser:false}
};

const apiConfig = apiMappings[validateEndPoint];
if (apiConfig && validateSingleApiMethods(apiConfig.method, req.headers).length === 0) {
const subAction = apiConfig?.hasOwnProperty("subAction")?apiConfig.subAction:""; 
const validateUser = apiConfig?.hasOwnProperty("validateUser")?apiConfig.validateUser:true;

let userInfo = null;
if(validateUser===true){
  userInfo = await validateUserAuthorization(req);
  if (!userInfo) {
      return returnResponse(400, "Unexpected token", null);
  }
}

if(!(subAction==="") && validateUser===true){
  return await apiConfig.handler(req, userInfo,apiConfig.subAction);
}
else if(subAction==="" && validateUser===false){
  return await apiConfig.handler(req, apiConfig.subAction);
}
else if(subAction==="" && validateUser===true){
  return await apiConfig.handler(req, userInfo);
}
// No need any u
else if(subAction==="" && validateUser===false){
  return await apiConfig.handler(req);
}
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
// console.log("pathName >>************ * * pathName >> 1111 :", pathName);
if (pathName.startsWith("/api/")) {
  const path = pathName.slice(4); // Remove "/api" part
  // console.log("pathName >>************ * * pathName >> 22222 :", path);
  if(path.length>1 && path.startsWith("/")){
    result = path;
  }
}
// console.log("pathName >>************ * * pathName >> 3333 :", result);
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
    console.log("method >>************ * * >> 0000 method :", method);
    console.log("method >>************ * * >> 0000 headers :", headers);
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