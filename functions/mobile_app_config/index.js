import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders, getHeaderAuthorization, getApiRequest,validateEndPoint,validateMethods,generateUniqueIntId } from "../validate_functions/index.js";// Assuming this module exports `returnResponse`


// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

const acceptMediaFor = ["leads","inventory","property","followup"];

// const handler = (req) => {
//   const url = new URL(req.url);
//   const query = url.searchParams.get("name") || "World";
//   return new Response(`Hello, ${query}!`, { status: 200 });
// };
// await serve(handler, { port: 54321 });

// serve(async (req) => {
//   try {
//     const url = new URL(req.url);
//     console.log("Called API:", url.pathname);

//     const validateError = validateEndPoint(req, ['/mobile_app_config/get_price_range','/mobile_app_config/get_price_allrange']);
//     if (!validateError) {
//       return returnResponse(400, JSON.stringify({ error: "Invalid endpoint" }), null);
//     }

//     // const authToken = getHeaderAuthorization(req.headers);
//     // if (!authToken) {
//     //   return returnResponse(401, JSON.stringify({ error: "Authorization token missing" }), null);
//     // }

//     // const userInfo = await verifyJWT(authToken);
//     // if (!userInfo) {
//     //   return returnResponse(403, JSON.stringify({ error: "Invalid token" }), null);
//     // }

//     if (url.pathname === "/mobile_app_config/get_price_range") {
//       return await getPriceRange(req);
//     }

//     return returnResponse(400, JSON.stringify({ error: "Unsupported endpoint" }), null);
//   } catch (err) {
//     console.error("Server error:", err);
//     return returnResponse(500, JSON.stringify({ error: "Internal Server Error" }), null);
//   }
// });


/// Get  Lead type
export async function getPriceRange(req) {
  try {
const apiMethod = "GET";
const reqData = await getApiRequest(req,apiMethod);
console.log('No leads found >>> ',reqData);
const returnColumn = ['created_at','title','budget_code'].join(', ');
// Check if the email exists in the `users` table
const { data, error } = await _supabase
  .from('priceRange')
  .select(returnColumn).eq("type",reqData.get('type')).order('id', { ascending: true });

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
return returnResponse(200, 'Successfully.', leads);
}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}

/// Update media file
export async function addMediaFile(req,{userInfo}) {
  try {
     
const apiMethod = "POST";
const reqData = await getApiRequest(req,apiMethod);
console.log('No leads found >>> ',reqData);
//media_type  p_id media_for
if (!("files_url" in reqData) || reqData["files_url"] <= 0 || !("p_id" in reqData) || !("media_for" in reqData)) {
  console.error('Please enter mandatory fields data', "error");
  return returnResponse(500, `Please enter mandatory fields data`, null);
}
if (!(acceptMediaFor.includes(reqData["media_for"].toLowerCase()))) {
  console.error('Please enter mandatory fields data', "error");
  return returnResponse(500, `Invalid media_for valu. Expected ${acceptMediaFor}, but received '${reqData["media_for"]}`, null);
}

const pId = reqData["p_id"];

const mediaFor = reqData["media_for"];

const filesUrl = reqData["files_url"];
var selectedColunName;

switch(mediaFor){
  case 'leads':{
    console.log('mediaFor 0000  >>> :', mediaFor);
    selectedColunName = "p_id";
  }
  break;
  case 'inventory':{
    console.log('mediaFor 1 1 1 >>> :', mediaFor);
    selectedColunName = "inventory_id";
  }
  break;
}

// Generate the custom list
const customList = filesUrl.map(file => {
  var extension = "";
  var fileUrl = file;
  const lastDotIndex = fileUrl.lastIndexOf('.');
  console.log('fileId >>>> if lastDotIndex :', lastDotIndex);
  if (!(lastDotIndex === -1)) // No extension found
  {
    extension = fileUrl.substring(lastDotIndex + 1).split(/\#|\?/)[0];
    fileUrl = fileUrl.substring(0, fileUrl.lastIndexOf(`.${extension}`));
  }
  const fileId = generateUniqueIntId({length:3});
  console.log('fileId >>>> if fileUrl >>> :', fileUrl);
var requestData = {
  media_type: extension, // Default to "jpeg" if media_type is missing
  file_url: fileUrl, // Directly assigning the file as file_url
  media_for: mediaFor, // Assuming mediaFor is defined elsewhere
  file_id: fileId // Use file_id directly from file
}
requestData[selectedColunName] = pId;

return requestData;
});

const returnColumn = ['file_url','media_type','category','sub_category','file_id','media_for'].join(', ');
// await _supabase
//   .from('mediaFiles')
//   .select(returnColumn).eq("type",reqData.get('type')).order('id', { ascending: true });
//   const { data:daveData, error:error1 } =
// Check if the email exists in the `users` table
const { data, error } =  await _supabase
  .from('mediaFiles')
  .insert(
    customList
  ).select('*');

if (error) {
  console.error('Error checking leads:', error);
  return returnResponse(500, `Error checking leads: ${error.message}`, null);
}

const { data:data1, error:error1 } =  await _supabase
  .from('mediaFiles')
  .select(returnColumn).eq(selectedColunName,pId).eq("is_deleted",false).eq("media_for",mediaFor).order('id', { ascending: false });

  if (error1) {
    console.error('Error checking leads:', error1);
    return returnResponse(500, `Error checking leads: ${error1.message}`, null);
  }
// Check for multiple rows and handle accordingly
if (!data1 || data1.length === 0) {
  console.log('No leads found');
  return returnResponse(404, 'No leads found', null);
}

// Single row returned
const leads = data1;
console.log('Contact found:', leads);
return returnResponse(200, 'Successfully.', leads);
}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}


/// Update media file
export async function deleteMediaFile(req,{userInfo}) {
  try {
     
const apiMethod = "POST";
const reqData = await getApiRequest(req,apiMethod);
console.log('No leads found >>> ',reqData);
//media_type  p_id media_for
if (!("file_id" in reqData) || reqData["file_id"] <= 0 || !("p_id" in reqData) || !("media_for" in reqData)) {
  console.error('Please enter mandatory fields data', "error");
  return returnResponse(500, `Please enter mandatory fields data`, null);
}
if (!(acceptMediaFor.includes(reqData["media_for"].toLowerCase()))) {
  console.error('Please enter mandatory fields data', "error");
  return returnResponse(500, `Invalid media_for valu. Expected ${acceptMediaFor}, but received '${reqData["media_for"]}`, null);
}

const pId = reqData["p_id"];

const mediaFor = reqData["media_for"];

const fileId = reqData["file_id"];
var selectedColunName;

switch(mediaFor){
  case 'leads':{
    console.log('mediaFor 0000  >>> :', mediaFor);
    selectedColunName = "p_id";
  }
  break;
  case 'inventory':{
    console.log('mediaFor 1 1 1 >>> :', mediaFor);
    selectedColunName = "inventory_id";
  }
  break;
}

console.log('fileId >>>> if fileId list >>> :', fileId);

const { data, error } = await _supabase
.from('mediaFiles')
.update({ is_deleted: true }) // Fields to update
.eq(selectedColunName, pId)   // Additional condition
.in('file_id', fileId);       // Matches rows with file_id in the list

if (error) {
  console.error('Error checking leads:', error);
  return returnResponse(500, `Error checkining: ${error.message}`, null);
}

console.log('Dleted file found:', leads);
return returnResponse(200, 'Deleted Successfully.', null);
}
catch (err) 
{
            console.error('Server error: new', err);
            return returnResponse(500,`User not exist`,null);
 }
}



