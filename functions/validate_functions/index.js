import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';


export function validateHeaders(method,headers) {
  const errors = [];
  // Validate HTTP method
  if (!["post", "get","delete"].includes(method.toLowerCase())) {
    errors.push(`Invalid HTTP method. Expected 'POST' or 'GET', but received '${method}'.`);
  }
  // Check Content-Type header
  const contentType = headers.get("content-type");
  // customLog("userInfo >>************ * * >> 000000$$$ :", contentType);
  if (!contentType || !["application/json", "application/json; charset=utf-8"].includes(contentType)) {
    errors.push("Invalid or missing Content-Type. Expected 'application/json'.");
  }
  // Check Authorization header
  const authorization = headers.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    // customLog("userInfo >>************ * * >> 2222 :", authorization);
    errors.push("Missing or invalid Authorization header. Expected 'Bearer <token>'.");
  }
  // Add additional header validations if necessary
  return errors;
}



export function validateMethods(method,headers) {
  const errors = [];
  // Validate HTTP method
  if (!["post", "get","delete"].includes(method.toLowerCase())) {
    // customLog("userInfo >>************ * * >> 0000 :", method);
    errors.push(`Invalid HTTP method. Expected 'POST' or 'GET', but received '${method}'.`);
  }

  // Check Content-Type header
  const contentType = headers.get("content-type");
  if (!contentType || !["application/json", "application/json; charset=utf-8"].includes(contentType)) {
    // customLog("userInfo >>************ * * >> 1111000 :", contentType);
    errors.push("Invalid or missing Content-Type. Expected 'application/json'.");
  }

  // Add additional header validations if necessary
  return errors;
}



export function validateEndPoint(req,endPointNames = []) {
  var result = '';
    // Validate if the array is provided and is actually an array
    if (!Array.isArray(endPointNames)) {
      // throw new Error("paramsArray must be an array");
      result = null;
      //errors.push(`paramsArray must be an array`);
  }

  if (endPointNames.length <= 0) {
    result = null;
}

    const url = new URL(req.url);
    const pathName = url.pathname;
    // customLog("userInfo >>************ * * pathName >> 1111 :", pathName);
    // Check if the request URL matches any of the endpoint names
    if (endPointNames.some(endpoint => pathName.includes(endpoint))) {
   
      result = pathName;
      // customLog("userInfo >>************ * * pathName >> 2222 :", result);
      //errors.push(`Invalid endpoint: ${pathName}`);
    }
    // if(!url.includes(endPointNames)){
    //   customLog("userInfo >>************ * * >> 0000 :", method);
    //   errors.push(`Invalid end API point`);
    // }
  // Add additional header validations if necessary

  customLog("userInfo >>************ * * pathName >> 3333 :", result);
  return result;
}


export function getHeaderAuthorization(headers) {
  // Check Authorization header
  const authorization = headers.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.split(" ")[1];
  }
  else {
    return null;
  }
}

export async function getApiRequest(req, method) {
  const url = new URL(req.url);
  var reqData = null;
  // Validate HTTP method
  if (["post", "get","delete"].includes(method.toLowerCase())) {

switch(method.toLowerCase()){
case 'post':{
  reqData = await req.json();
  break ;
}

case 'get':{
  const url = new URL(req.url);
  // customLog("called API >>>> :", url);
  reqData = url.searchParams;
  break ;
}

case 'delete':{
  reqData = await req.json();
  break ;
}

}
}
customLog(`api requested data > > (${url} )`, reqData);
return reqData;
}

/**
 * Filters out specified keys from an object.
 *
 * @param {Object} data - The object to filter.
 * @param {string[]} keysToExclude - An array of keys to exclude from the object.
 * @returns {Object} A new object with the specified keys excluded.
 */
export function validateRequredReqFields(data, keysToExclude = []) {

  customLog(' data   > > >  >', data);
 
  if (data instanceof URLSearchParams) {
    // customLog(' data   > > >  > 000 ' , data);
// Get all values
const allParams = {};
try{
  for (const [key, value] of data.entries()) {
    allParams[key] = value;
  }
  // customLog(' data   > > >  > 111 ', allParams);
    data =  allParams;
}
catch(error){
  customLog(' data   > > >  >', data);
}
  }

  // Find missing keys
  const missingKeys = keysToExclude.filter(
    key => !(key in data) || data[key] === null || data[key] === undefined || data[key] === ''
  );
  
  if (missingKeys.length > 0) {
    // Return missing keys if any are found
    return { missingKeys };
  }

  // Filter out excludeKeys from the object if all keys exist
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) => !keysToExclude.includes(key))
  );
  // customLog(' data   > >  00 0 >  >', data);
  return { data, missingKeys: [] }; // No missing keys
}

//, optionalKeysToExclude = []
export function getFilteredReqData(data, keysToExclude = []) {
  if (data instanceof URLSearchParams) {
    // customLog(' data   > > >  > 000 ' , data);
// Get all values
const allParams = {};
try{
  for (const [key, value] of data.entries()) {
    allParams[key] = value;
  }
  // customLog(' data   > > >  > 111 ', allParams);
    data =  allParams;
}
catch(error){
  customLog(' data   > > >  >', data);
}
  }
  // Filter out excludeKeys from the object if all keys exist
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) => keysToExclude.includes(key))
  );
return filteredData; // No missing keys
}












export function isValidEmail(email) {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
}


export function getMinMaxPriceFromBudgetCode(budgetCode) {
  // const str = reqData[budgetCode];
  const regex = /range_(\w+)_(\d+)to(\d+)/;
  const match = budgetCode.match(regex);

  const amountUnit = match[1];
  var minValue = match[2];
  var maxValue = match[3];

  if(amountUnit.toLowerCase()==='k'){
    minValue = minValue * 1000;
    maxValue = maxValue * 1000;
  }
  else if(amountUnit.toLowerCase()==='l'){
    minValue = minValue * 100000;
    maxValue = maxValue * 100000;
  }
  else if(amountUnit.toLowerCase()==='lc'){
    minValue = minValue * 100000;
    maxValue = maxValue * 10000000;
  }
  else if(amountUnit.toLowerCase()==='c'){
    minValue = minValue * 10000000;
    maxValue = maxValue * 10000000;
  }
  return [minValue,maxValue ];
}



export function getPriceFromString(priceStr) {
  // Matches a number followed by optional space and unit
  // const regex = /(\d+)\s*([a-zA-Z]+)/; 
  const regex = /(\d+(\.\d+)?)\s*([a-zA-Z]+)/;

  const match = priceStr.match(regex);

  if (!match) {
    throw new Error('Invalid price format');
  }

  const amount = match[1];//parseInt(match[0], 10);
  const unit = match[3].toLowerCase();

  let maxValue = amount;

  if(unit === 'sqft' || unit === 'sqyd' || unit === 'sqmt'){
    maxValue = amount;
  }
  else if (unit === 'k') {
    maxValue = amount * 1000; // Thousand 
  }
  else if (unit === 'l') {
    maxValue = amount * 100000; // Lakhs
  }
  else if (unit === 'lc' || unit === 'c') {
    maxValue = amount * 10000000; // Crores
  }

  customLog(`PriceFromString convert #### ${match} <> ${priceStr}` , [maxValue, unit]);

  return [maxValue, unit];
}


export function formatNumber(num) {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + 'Cr'; // For Crores
  } else if (num >= 100000) {
    return (num / 100000).toFixed(1) + 'L'; // For Lakhs
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'; // For Thousands
  }
  return num.toString(); // For smaller numbers
}

export function generateUniqueIntId(options = {}) {
  const {length = 4 ,sliceLength = 6 } = options; // Destructure options with defaults
  const timestamp = Date.now(); // Get the current timestamp in milliseconds
  // const randomPart = Math.floor(Math.random() * randomRange); // Random number based on randomRange
  const randomPart = getFixedLengthRandomNumber(length);
  return parseInt(timestamp.toString().slice(-sliceLength) + randomPart); // Combine sliced timestamp with random part
}


export function customLog(message, ...optionalParams) {
  console.log(`custom log ${message}`, ...optionalParams);
}

function getFixedLengthRandomNumber(length) {
  const min = Math.pow(10, length - 1); // Smallest number with the given length
  const max = Math.pow(10, length) - 1; // Largest number with the given length
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

