import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders, getApiRequest,getMinMaxPriceFromBudgetCode,getPriceFromString,generateUniqueIntId,validateRequredReqFields,getFilteredReqData,customLog} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`
import {verifyJWT } from "../jwt_auth/index.js";
import {addMediaFileInfo,deleteMediaFileInfo } from "../mobile_app_config/index.js";

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);


const projectReturnColumn = ["title",
"remark",
"created_at",
"project_id",
"developer_id",
"project_type",
"rera_approval",
"brokerage_type",
"nearby_project",
"project_status",
"initial_payment",
"payments_term_remark",
"development_permission","brokerage_note",
"construction_permission"];

const invertoryReturnColumn = ["created_at","preferred_location","min_budget","purpose","additional_details","lead_type","property_size","assigne_id","max_budget",
"city","lat","lng","full_adress","amount_symbol_id","country_code","is_deleted","is_verified","asking_price","sell_type","inventory_id","lead_id","budget_label"];
const returnContactColumn = ['phone','first_name','last_name','contact_id','county_code'];
const returnadditionalDetailColumn  = ['remark','gar_facing_charge','east_facing_change','electricity_charge'];
const returnaAddressColumn  = [ "lat",
"city",
"long",
"country",
"landmark",
"area_code",
"is_active",
"created_at",
"is_deleted",
"project_full_address"];

const invertoryOfProjectReturnColumn = ["created_at","min_budget","lead_type","property_size","asking_price","project_id","budget_label","number_of_unit","remark"];

export async function addProject(req,userInfo){
  try
  {
                /// Get data from API
const reqData = await getApiRequest(req,"POST");

console.log(' User information ######################', userInfo);

  const missingKeys = validateRequredReqFields(reqData,['title','developer_id','project_type','project_status','city','project_full_address','lat','long']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

      const projectReqData = getFilteredReqData(reqData,['title','developer_id','project_type','project_status','nearby_project','remark','brokerage_type','brokerage_note']);
      const addressData =  getFilteredReqData(reqData,['city','project_full_address','landmark','lat','long','country','area_code']);

     const projectId = generateUniqueIntId({length : 4 ,sliceLength : 6});
     projectReqData['project_id'] = projectId;
     addressData['project_id'] = projectId;
      const { data, error } = await _supabase
      .from('projects')
      .insert(
        projectReqData,
      )
      .select(`id`)
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Project add Failed: ${error.message}`, null);
      }
    console.log(' User information ###################### leadDetails >> ', data);
    // Add lead in user lead refrence table
    if(!(data===null)){
      const { data, error } = await _supabase
      .from('rUserProjects')
      .insert([
        {
          "user_id": userInfo['id'],
          "project_id": projectId
        },
      ])
      .select(`project_id`)
      .single();

      const { data:addedAddressData, error:addressError } = await _supabase
      .from('project_address')
      .insert(addressData)
      .select(`project_id`)
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Failed: ${error.message}`, null);
      }

    }

    console.log(' User information ***************** projectDetails > leadId > ', data);
    const { data: projectDetails, error: error1 }  = await asyncgetProjectDetails(projectId);
    if (error1) {
      console.error('Error fetching joined data:', error1);
      return returnResponse(500, `Failed: ${error.message}`, null);
    } 
    
    if(projectDetails!=null){
      return returnResponse(200, 'Success', projectDetails);
    }
    else
    {
      return returnResponse(400, 'No data found', {});
    }
    
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}

/// Get  Lead type
export async function getAllProjects(req,userInfo) {
  try {
           const apiMethod = "GET";
            // Validate headers and method
            const errors = validateHeaders(apiMethod,req.headers);
            if (errors.length > 0) {
              return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
            }

// `inventories(${invertoryReturnColumn},contacts(${returnContactColumn}),
//   propertyType(${['title','property_type'].join(', ')}))
// `
const { data: data1, error: error1 } = await _supabase
.from('rUserProjects')
  .select(`projects(${projectReturnColumn.join(', ')},inventories(${invertoryOfProjectReturnColumn.join(', ')}),
    project_additional_details(${returnadditionalDetailColumn.join(', ')}),
    project_address(${returnaAddressColumn.join(', ')}),
    media_files!left(
      file_url, media_type, category, sub_category, file_id, media_for
    ))`)
  .eq('is_deleted', false)
  .eq('user_id', userInfo.id)
  .eq('projects.is_deleted', false) // Filter on contact's 'is_deleted' (if needed)
  .eq('projects.is_published', true) 
  .eq('projects.media_files.is_deleted', false) // Filters applied to `media_files`
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
  // const projectsList = data1.map((item) => item.projects).filter((project) => project != null);
  const projectsList = data1.map((item) => item.projects).filter((project) => project != null).map((project) => {
    let media_files = {};
    if(!(project['media_files']===null) && project['media_files'].length>0){
     let category = 'map';
     let mapFilesList = project['media_files'].filter(file => file['category'].toLowerCase() === category.toLowerCase());
     media_files['map'] = mapFilesList;
     category = 'photo';
     let photoFilesList = project['media_files'].filter(file => file['category'].toLowerCase() === category.toLowerCase());
     media_files['photo'] = photoFilesList;
     category = 'brochure';
     let brochureFilesList = project['media_files'].filter(file => file['category'].toLowerCase() === category.toLowerCase());
     media_files['brochure'] = brochureFilesList;
     console.log(`Media file ${media_files}`);
    }
    return {
        ...project, // Spread the existing project properties
        media_files
    };
});
  if(projectsList!=null && projectsList.length>0){
  return returnResponse(200, 'Success', projectsList);
  }
  return returnResponse(400, 'No data found', []);
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

export async function addListing(req,userInfo){
  try
  {
                /// Get data from API
const reqData = await getApiRequest(req,"POST");

console.log(' User information ######################', userInfo);

  const missingKeys = validateRequredReqFields(reqData,['property_type','property_size','asking_price','number_of_unit','project_id']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

 const projectReqData = getFilteredReqData(reqData,['property_type','property_size','asking_price','number_of_unit','remark','project_id','project_id','lead_type','full_adress']);
 console.log(' projectReqData ***', projectReqData);
 const projectId = projectReqData['project_id'];
     projectReqData['is_published'] = false;
    const invertoryId = generateUniqueIntId({length : 4 ,sliceLength : 6});
    projectReqData['project_id'] = projectId;
    projectReqData['inventory_id'] = invertoryId;

    if('asking_price' in projectReqData){
      const budgetValues = getPriceFromString(projectReqData["asking_price"]);
      projectReqData["min_budget"] = 0;
      projectReqData["max_budget"] = 0;
      projectReqData["asking_price"] = budgetValues[0];
      projectReqData["budget_label"] = `${budgetValues[0]} ${budgetValues[1]}` ;
       }  
    console.log(' projectReqData information ###################### projectReqData', projectReqData);
    //  return returnResponse(200, `Project details ${projectId}`,projectReqData);
      const { data, error } = await _supabase
      .from('inventories')
      .insert(
        projectReqData,
      )
      .select(`id`)
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Add Listing Failed: ${error.message}`, null);
      }
    console.log(' User information ###################### leadDetails >> ', data);
    // Add lead in user lead refrence table
    if(!(data===null)){
        // Inset in invertory table
        const { data:daveData, error:error1 } = await _supabase
        .from('rUserInventories')
        .insert(
          {
            "user_id": userInfo['id'],
            "project_id": projectId,
            "inventory_id":invertoryId
          },
        )
        .select(`*`)
        .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Failed: ${error.message}`, null);
      }

    }

    console.log(' User information ***************** projectDetails > leadId > ', data);
    const { data: projectDetails, error: error1 }  = await asyncgetProjectDetails(projectId);
    if (error1) {
      console.error('Error fetching joined data:', error1);
      return returnResponse(500, `Failed: ${error.message}`, null);
    } 
    
    if(projectDetails!=null){
      return returnResponse(200, 'Success', projectDetails);
    }
    else
    {
      return returnResponse(400, 'No data found', {});
    }
    
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}

export async function updateListing(req,userInfo){
  try
  {
                /// Get data from API
const reqData = await getApiRequest(req,"POST");

console.log(' User information ######################', userInfo);

  const missingKeys = validateRequredReqFields(reqData,['property_type','property_size','asking_price','number_of_unit','project_id']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

 const projectReqData = getFilteredReqData(reqData,['property_type','property_size','asking_price','number_of_unit','remark','project_id']);

 const projectId = projectReqData['project_id'];
     projectReqData['is_published'] = false;
    const invertoryId = generateUniqueIntId({length : 4 ,sliceLength : 6});
    projectReqData['project_id'] = projectId;
    projectReqData['inventory_id'] = invertoryId;

    if('asking_price' in projectReqData){
      const budgetValues = getPriceFromString(projectReqData["asking_price"]);
      projectReqData["min_budget"] = 0;
      projectReqData["max_budget"] = 0;
      projectReqData["asking_price"] = budgetValues[0];
      projectReqData["budget_label"] = `${budgetValues[0]} ${budgetValues[1]}` ;
       }
    console.log(' projectReqData information ###################### projectReqData', projectReqData);
    //  return returnResponse(200, `Project details ${projectId}`,projectReqData);
      const { data, error } = await _supabase
      .from('inventories')
      .insert(
        projectReqData,
      )
      .select(`id`)
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Add Listing Failed: ${error.message}`, null);
      }
    console.log(' User information ###################### leadDetails >> ', data);
    // Add lead in user lead refrence table
    if(!(data===null)){
        // Inset in invertory table
        const { data:daveData, error:error1 } = await _supabase
        .from('rUserInventories')
        .insert(
          {
            "user_id": userInfo['id'],
            "project_id": projectId,
            "inventory_id":invertoryId
          },
        )
        .select(`*`)
        .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Failed: ${error.message}`, null);
      }

    }

    console.log(' User information ***************** projectDetails > leadId > ', data);
    const { data: projectDetails, error: error1 }  = await asyncgetProjectDetails(projectId);
    if (error1) {
      console.error('Error fetching joined data:', error1);
      return returnResponse(500, `Failed: ${error.message}`, null);
    } 
    
    if(projectDetails!=null){
      return returnResponse(200, 'Success', projectDetails);
    }
    else
    {
      return returnResponse(400, 'No data found', {});
    }
    
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}

export async function addPaymentTerms(req,userInfo){
  try
  {
                /// Get data from API
const reqData = await getApiRequest(req,"POST");

console.log(' User information ######################', userInfo);

  const missingKeys = validateRequredReqFields(reqData,['initial_payment','development_permission','rera_approval','construction_permission','project_id']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

 const projectReqData = getFilteredReqData(reqData,['project_id','payments_term_remark','initial_payment','development_permission','rera_approval','construction_permission']);
 const projectId = projectReqData['project_id'];
    console.log(' projectReqData information ###################### projectReqData', projectReqData);
    //  return returnResponse(200, `Project details ${projectId}`,projectReqData);
      const { data, error } = await _supabase
      .from('projects')
      .update(
        projectReqData,
      ).
      eq("project_id",projectReqData['project_id'])
      .select(`*`)
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Add Listing Failed: ${error.message}`, null);
      }
    console.log(' User information ###################### leadDetails >> ', data);
    // Add lead in user lead refrence table
    if(!(data===null)){
      console.log(' User information ***************** projectDetails > leadId > ', data);
    const { data: projectDetails, error: error1 }  = await asyncgetProjectDetails(projectId);
    if (error1) {
      console.error('Error fetching joined data:', error1);
      return returnResponse(500, `Failed: ${error.message}`, null);
    } 
    
    if(projectDetails!=null){
      return returnResponse(200, 'Success', projectDetails);
    }
    else
    {
      return returnResponse(400, 'No data found', {});
    }
    }
    return returnResponse(400, 'No data found', {});
    
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}

export async function addProjectAdditionalDetails(req,userInfo){
  try
  {
                /// Get data from API
const reqData = await getApiRequest(req,"POST");

console.log(' User information ######################', userInfo);

  const missingKeys = validateRequredReqFields(reqData,['gar_facing_charge','east_facing_change','electricity_charge','project_id']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }

 const projectReqData = getFilteredReqData(reqData,['project_id','remark','gar_facing_charge','east_facing_change','electricity_charge']);
 const projectId = projectReqData['project_id'];
    console.log(' projectReqData information ###################### projectReqData', projectReqData);
    //  return returnResponse(200, `Project details ${projectId}`,projectReqData);
      const { data, error } = await _supabase
      .from('project_additional_details')
      .insert(
        projectReqData,
      )
      .select(`*`)
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Add Listing Failed: ${error.message}`, null);
      }
    console.log(' User information ###################### leadDetails >> ', data);
    // Add lead in user lead refrence table
    if(!(data===null)){
    console.log(' User information ***************** projectDetails > leadId > ', data);
    const { data: projectDetails, error: error1 }  = await asyncgetProjectDetails(projectId);
    if (error1) {
      console.error('Error fetching joined data:', error1);
      return returnResponse(500, `Failed: ${error.message}`, null);
    } 
    
    if(projectDetails!=null){
      return returnResponse(200, 'Success', projectDetails);
    }
    else
    {
      return returnResponse(400, 'No data found', {});
    }
    }
    return returnResponse(400, 'No data found', {});
    
  }
  catch (err) {
    console.error('Server error: new', err);
    return returnResponse(500,`Server side error ${err}`,null);
  }
}

/// Update media file
export async function addProjectMediaFile(req,{userInfo}) {
  try {    
const apiMethod = "POST";
const reqData = await getApiRequest(req,apiMethod);
console.log('No leads found >>> ',reqData);
const missingKeys = validateRequredReqFields(reqData,['files_url','p_id','category']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }
const projectMediaReqData = getFilteredReqData(reqData,['files_url','p_id','category']);
return await addMediaFileInfo(projectMediaReqData,"project");
}
catch (err) 
{
 console.error('Server error: new', err);
 return returnResponse(500,`User not exist`,null);
 }
}


export async function deleteProjectMediaFile(req,{userInfo}) {
  try {    
const apiMethod = "DELETE";
const reqData = await getApiRequest(req,apiMethod);
console.log('No leads found >>> ',reqData);
const missingKeys = validateRequredReqFields(reqData,['file_id','p_id']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }
const projectMediaReqData = getFilteredReqData(reqData,['file_id','p_id']);
return await deleteMediaFileInfo(projectMediaReqData,"project");
}
catch (err) 
{
 console.error('Server error: new', err);
 return returnResponse(500,`User not exist`,null);
 }
}


export async function pulishProjectInvertory(req,userInfo){
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

console.log('Found data publish listing >>', data);

if(error) {
  console.error('Server error: new', error);
  return returnResponse(500,`Data not found`,null);
}
var invertoryId;
var updatedMediaFiles;
if(data==null){
  invertoryId = generateUniqueIntId({length : 4 ,sliceLength : 6});
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


let mediaFilesList = [];
/// Media File copy    
try{
  if("media_files" in leadDetail) {
  console.log('media_files Files  >>:', leadDetail['media_files']); 
  mediaFilesList = leadDetail['media_files']; 
  delete leadDetail.media_files;
    }
 }
 catch (err) {
  console.error('media_files Files final >> Error', err);  
   return "";
 } 

 
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

  try{
    if(mediaFilesList.length>0) {
    console.log('media_files Files  >>:', mediaFilesList); 
    console.log('media_files Files  >> inventory_id :', daveData2["inventory_id"]); 
   const mediaResult =  await copyMediaData(mediaFilesList,daveData2["inventory_id"]);
   console.log('media_files Files final >>', mediaResult);  
      }
   }
   catch (err) {
    console.error('media_files Files final >> Error', err);  
     return "";
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
    invertoryId = generateUniqueIntId({length : 4 ,sliceLength : 6});
  }
  console.log('invertoryId >>>> else :', invertoryId);

  const { data: leadDetail, error: error1 }  = await asyncgetLeadDetails(leadId);
if (error1) {
              console.error('Error fetching joined data:', error1);
              return returnResponse(500, `Failed: ${error1.message}`, null);
            }

            leadDetail["lead_id"] = reqData['lead_id'];  
            console.error('Fetched lead data >>:', leadDetail); 

let mediaFilesList = [];
/// Media File copy    
try{
  if("media_files" in leadDetail) {
  console.log('media_files Files  >>:', leadDetail['media_files']); 
  mediaFilesList = leadDetail['media_files']; 
  delete leadDetail.media_files;
    }
 }
 catch (err) {
  console.error('media_files Files final >> Error', err);  
   return "";
 } 


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

try{
  if(mediaFilesList.length>0) {
  console.log('media_files Files  >>:', mediaFilesList); 
 const mediaResult =  await copyMediaData(mediaFilesList,daveData1["inventory_id"]);
 console.log('media_files Files final >>', mediaResult);  
    }
 }
 catch (err) {
  console.error('media_files Files final >> Error', err);  
   return "";
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

/// Get  Lead type
export async function getProjectListing(req,userInfo) {
  try {
       
           const reqData = await getApiRequest(req,"GET");
            const missingKeys = validateRequredReqFields(reqData,['project_id']);
            if (missingKeys['missingKeys'].length > 0) {
              console.error('Please enter mandatory fields data', "error");
              return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
            }
          
           const projectReqData = getFilteredReqData(reqData,['project_id']);
          
           const projectId = projectReqData['project_id'];
                       
const { data: data1, error: error1 } = await _supabase
.from('rUserInventories')
  .select(`inventories(${invertoryOfProjectReturnColumn.join(', ')},
  propertyType(${['title','property_type'].join(', ')}), media_files!left(
    file_url, media_type, category, sub_category, file_id, media_for, is_deleted
  ))
`)
  .eq('is_deleted', false)
  .eq('user_id', userInfo.id)
  .eq('project_id', projectId)
  .eq('inventories.is_deleted', false) // Filter on contact's 'is_deleted' (if needed)
  .eq('inventories.media_files.is_deleted', false) // Filters applied to `media_files`
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

export async function getProjectDetail(req) {
  try {
            const apiMethod = "GET";
            const reqData = await getApiRequest(req,apiMethod);
            console.log('Requested get project datail :', reqData);
            const missingKeys = validateRequredReqFields(reqData,['project_id']);
            if (missingKeys['missingKeys'].length > 0) {
              console.error('Please enter mandatory fields data', "error");
              return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
            }
     
 const { data: leadDetail, error: error1 }  = await asyncgetProjectDetails(reqData.get("project_id"));
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



export async function searchProject(req,userInfo) {
  try {
     /// Get data from API
  const reqData = await getApiRequest(req,"GET");
  const missingKeys = validateRequredReqFields(reqData,['search_value']);
    if (missingKeys['missingKeys'].length > 0) {
      console.error('Please enter mandatory fields data', "error");
      return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
    } 
  const localReqData = getFilteredReqData(reqData,['search_value']);  
  // Convert the array to a string of key-value pairs
const addressReturnJson = returnaAddressColumn
.map((col) => `'${col}', project_address.${col}`)
.join(', ');

const projectReturnJson = projectReturnColumn
.map((col) => `p.${col}`)
.join(', ');

const serchFor = `SELECT
  ${projectReturnJson},
     (
     SELECT jsonb_build_object(
      ${addressReturnJson}
     )
     FROM "project_address"
     WHERE project_address.project_id = p.project_id
     LIMIT 1
   ) AS project_addresses,
   (
     SELECT jsonb_build_object(
       'developer_id', developer.developer_id,
       'developer_name', developer.developer_name
     )
     FROM "developer"
     WHERE developer.developer_id = p.developer_id
     LIMIT 1
   ) AS developer
   ,
   jsonb_agg(DISTINCT jsonb_build_object(
           'file_url', media_files.file_url,
           'media_type', media_files.media_type,
           'category', media_files.category,
           'media_for', media_files.media_for,
           'sub_category', media_files.sub_category,
           'file_id', media_files.file_id
   )) AS media_files
 FROM "rUserProjects" rul
 LEFT JOIN "projects" p ON rul.project_id = p.project_id
 LEFT JOIN "project_address" p_address ON p.project_id = p_address.project_id
 LEFT JOIN "developer" developer ON p.developer_id = developer.developer_id
 LEFT JOIN "media_files" media_files ON p.project_id = media_files.project_id
 WHERE rul.is_deleted = FALSE
   AND p.is_deleted = FALSE
   AND p.is_published = TRUE
   AND ${userInfo.id} = rul.user_id
   AND (
     p_address.project_full_address ILIKE '%${localReqData['search_value']}%'
     OR p_address.city ILIKE '%${localReqData['search_value']}%'
     OR p.title ILIKE '%${localReqData['search_value']}%'
     OR developer.developer_name ILIKE '%${localReqData['search_value']}%'
   )
 GROUP BY rul.id, p.id, p.project_id, p.title, p.developer_id
 ORDER BY rul.id DESC`;

    // Calling the custom RPC function to get coordinates
    const { data: result, error: coordinatesError } = await _supabase
      .rpc('raw_query', {
        p_query: serchFor
      });
  
    if (coordinatesError) {
      customLog(' coordinates error ####', coordinatesError);
      return returnResponse(500,`Data not found`,coordinatesError);
    }
    customLog('Search project result ####', result);
    if(result!=null && result.length>0){
      // const projectsList = result.map((item) => item.projects).filter((project) => project != null);
      const projectsList = await result.filter((project) => project != null).map((project) => {
        let media_files = {};
        try{if(!(project['media_files']===null) && project['media_files'].length>0){
          let category = 'map';
          let mapFilesList = project['media_files'].filter(file => file['category'].toLowerCase() === category.toLowerCase());
          media_files['map'] = mapFilesList;
          category = 'photo';
          let photoFilesList = project['media_files'].filter(file => file['category'].toLowerCase() === category.toLowerCase());
          media_files['photo'] = photoFilesList;
          category = 'brochure';
          let brochureFilesList = project['media_files'].filter(file => file['category'].toLowerCase() === category.toLowerCase());
          media_files['brochure'] = brochureFilesList;
          console.log(`Media file ${media_files}`);
         }}
        catch(error){

        }
        return {
            ...project, // Spread the existing project properties
            media_files
        };
    });

    customLog('Search project result projectsList ####', projectsList);
      if(projectsList!=null && projectsList.length>0){
      return returnResponse(200, 'Success', projectsList);
      }
      return returnResponse(400, 'No data found', result);
    }
    else
    {
      return returnResponse(400, 'No data found >', []);
    }  
  }
  catch (err) 
  {
              console.error('Server error: new', err);
              return returnResponse(500,`Data not found`,err);
   }
  }




//
async function asyncgetProjectDetails(projectId) {
  const { data: leadDetail, error: error1 } = await _supabase
  .from('projects')
  .select(`
  ${projectReturnColumn},inventories(${invertoryOfProjectReturnColumn.join(', ')},propertyType(${['title','property_type'].join(', ')})),
  project_additional_details(${returnadditionalDetailColumn.join(', ')}),
  project_address(${returnaAddressColumn.join(', ')}),
  developer(${['developer_name','developer_id'].join(', ')}),
  media_files(file_url,media_type,category,sub_category,file_id,media_for)
`).eq('is_deleted', false)
  .eq('media_files.is_deleted', false)
  .eq('project_id', projectId).single();

  try{
    if(!(leadDetail===null)){
      let media_files = {};
      if(!(leadDetail['media_files']===null) && leadDetail['media_files'].length>0){
       let category = 'map';
       let mapFilesList = leadDetail['media_files'].filter(file => file['category'].toLowerCase() === category.toLowerCase());
       media_files['map'] = mapFilesList;
  
       category = 'photo';
       let photoFilesList = leadDetail['media_files'].filter(file => file['category'].toLowerCase() === category.toLowerCase());
       media_files['photo'] = photoFilesList;
  
       category = 'brochure';
       let brochureFilesList = leadDetail['media_files'].filter(file => file['category'].toLowerCase() === category.toLowerCase());
       media_files['brochure'] = brochureFilesList;
       console.log(`Media file ${media_files}`);
       leadDetail['media_files'] = media_files;
      }
    }
  }
  catch(error){

  }
  return { data: leadDetail, error: error1 };

}

async function asyncgetLeadDetails(projectId) {
  return await _supabase
  .from('projects')
  .select(`*`)
  .eq('is_deleted', false)
  .eq('project_id', projectId).single();
}

async function asyncgetInventoryDetails(inventoryId) {
  return await _supabase
  .from('inventories')
  .select(`
  ${invertoryReturnColumn.join(', ')},
  contacts(${returnContactColumn.join(', ')}),
  propertyType(${['title','property_type'].join(', ')}),
  media_files(file_url, media_type, category, sub_category, file_id, media_for)
`).eq('is_deleted', false)
.eq('media_files.is_deleted', false)
  .eq('inventory_id', inventoryId).single();
}

async function copyMediaData(mediaDataList,invertoryId){
  try{
    

   const updatedMediaFiles = mediaDataList.map(item => ({
     ...item,  // Spread the existing properties
     inventory_id: invertoryId,  // Add the inventory_id
     media_for:"inventory"
   }));
// Fetch existing records from media_files based on file_id
// const { data: existingFiles, error: fetchError } = await _supabase
// .from('media_files')
// .select('*')
// .in('file_id', updatedMediaFiles.map(file => file.file_id));  // Check by file_id

// if (fetchError) {
// console.error('Error fetching existing files:', fetchError.message);
// }

//    const { data, error } =  await _supabase
//      .from('media_files')
//      .insert(
//        updatedMediaFiles
//      ).select('*');

// Perform the insert/upsert operation with the filtered list
const { data, error } = await _supabase
  .from('media_files')
  .upsert(updatedMediaFiles, { onConflict: ['file_id'] })
  .select('*');  // Fetch inserted rows
   if (error) {
     console.error('Media file coppy error:', error);
     return error.message;
   }
   return "";
   }
   catch (err) {
     return "";
   }
}
