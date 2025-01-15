import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';
import { returnResponse } from "../response_formatter_js/index.js";// Assuming this module exports `returnResponse`
import { validateHeaders, getApiRequest,getMinMaxPriceFromBudgetCode,getPriceFromString,generateUniqueIntId,validateRequredReqFields,getFilteredReqData} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

const returnDeveloperColunm = ['developer_name','developer_id'].join(', ');

export async function addDeveloper(req,userInfo){
  try
  {
const reqData = await getApiRequest(req,"POST");

  const missingKeys = validateRequredReqFields(reqData,['developer_name']);
  if (missingKeys['missingKeys'].length > 0) {
    console.error('Please enter mandatory fields data', "error");
    return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
  }
  const developerReqDetails = getFilteredReqData(reqData,['developer_name']);

  const develoerName = developerReqDetails['developer_name'];
  const { data: data1, error: error1 } = await _supabase
  .from('developer')
    .select(`${returnDeveloperColunm}`)
    .eq('developer_name', develoerName)
    .eq('is_deleted', false).single();
  
  if (error1) {
    console.error('Error fetching data:', error1);
  } 
  console.log('Developer information ><><><', data1);
    if(!(data1===null)){
      return returnResponse(500, `Developer already exist`, develoerName);
    }
 
  const developerId = generateUniqueIntId({length : 3 ,sliceLength : 6});

  developerReqDetails['developer_id'] = developerId;

  console.log('Developer information ### befor insert data', data1);

      const { data, error } = await _supabase
      .from('developer')
      .insert(
        developerReqDetails
      )
      .select(`${returnDeveloperColunm}`)
      .single();
      if (error) {
        console.error('Failed:', error);
        return returnResponse(500, `Project add Failed: ${error.message}`, null);
      }
    console.log(' Developer information ###leadDetails >> ', data);
    // Add lead in user lead refrence table
    if(!(data===null)){
      return returnResponse(200, 'Success', data);
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
export async function getDevelopers(req,userInfo) {
  try {
    const reqData = await getApiRequest(req,"GET");
    console.log(' Developer information ######################', reqData);
    const developerName = getFilteredReqData(reqData,['developer_name']);
    console.log(' Developer info developerName? ', developerName);
const { data: data1, error: error1 } = (JSON.stringify(developerName) === '{}')? await _supabase
.from('developer')
  .select(`${returnDeveloperColunm}`)
  .eq('is_deleted', false)
  .order('id', { ascending: true })
  :
  await _supabase
  .from('developer')
    .select(`${returnDeveloperColunm}`)
    .eq('developer_name', developerName['developer_name'])
    .eq('is_deleted', false)
    .order('id', { ascending: false });

if (error1) {
  console.error('Error fetching joined data:', error1);
} else {
  console.log('Joined data:', data1);
}

// // Single row returned
console.log('lead found:', data1);

if(data1!=null && data1.length>0){
  // const projectsList = data1.map((item) => item.projects).filter((project) => project != null);
  if(data1!=null && data1.length>0){
  return returnResponse(200, 'Success', data1);
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


// export async function getProjectDetail(req) {
//   try {
//             const apiMethod = "GET";
//             const reqData = await getApiRequest(req,apiMethod);
//             console.log('Requested get project datail :', reqData);
//             const missingKeys = validateRequredReqFields(reqData,['project_id']);
//             if (missingKeys['missingKeys'].length > 0) {
//               console.error('Please enter mandatory fields data', "error");
//               return returnResponse(500, `Please enter mandatory fields data`, missingKeys['missingKeys']);
//             }
     
//  const { data: leadDetail, error: error1 }  = await asyncgetProjectDetails(reqData.get("project_id"));
// if (error1) {
//               console.error('Error fetching joined data:', error1);
//               return returnResponse(500, `Not found`, null);
//             } 

// if(leadDetail!=null){
//   return returnResponse(200, 'Success', leadDetail);
// }
// else
// {
//   return returnResponse(400, 'No data found', {});
// }

// }
// catch (err) 
// {
//             console.error('Server error: new', err);
//             return returnResponse(500,`Not found`,null);
//  }
// }




