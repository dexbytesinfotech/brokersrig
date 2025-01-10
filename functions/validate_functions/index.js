import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';


export function validateHeaders(method,headers) {
  const errors = [];
  // Validate HTTP method
  if (!["post", "get","delete"].includes(method.toLowerCase())) {
    errors.push(`Invalid HTTP method. Expected 'POST' or 'GET', but received '${method}'.`);
  }
  // Check Content-Type header
  const contentType = headers.get("content-type");
  console.log("userInfo >>************ * * >> 000000$$$ :", contentType);
  if (!contentType || !["application/json", "application/json; charset=utf-8"].includes(contentType)) {
    errors.push("Invalid or missing Content-Type. Expected 'application/json'.");
  }
  // Check Authorization header
  const authorization = headers.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    console.log("userInfo >>************ * * >> 2222 :", authorization);
    errors.push("Missing or invalid Authorization header. Expected 'Bearer <token>'.");
  }
  // Add additional header validations if necessary
  return errors;
}



export function validateMethods(method,headers) {
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
    console.log("userInfo >>************ * * pathName >> 1111 :", pathName);
    // Check if the request URL matches any of the endpoint names
    if (endPointNames.some(endpoint => pathName.includes(endpoint))) {
   
      result = pathName;
      console.log("userInfo >>************ * * pathName >> 2222 :", result);
      //errors.push(`Invalid endpoint: ${pathName}`);
    }
    // if(!url.includes(endPointNames)){
    //   console.log("userInfo >>************ * * >> 0000 :", method);
    //   errors.push(`Invalid end API point`);
    // }
  // Add additional header validations if necessary

  console.log("userInfo >>************ * * pathName >> 3333 :", result);
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
  console.log("called API >>>> :", url);
  reqData = url.searchParams;
  break ;
}

case 'delete':{
  reqData = await req.json();
  break ;
}

}
}
return reqData;
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

  if(amountUnit.toLowerCase()==='l'){
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
  const regex = /(\d+)\s*([a-zA-Z]+)/; // Matches a number followed by optional space and unit
  const match = priceStr.match(regex);

  if (!match) {
    throw new Error('Invalid price format');
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  let maxValue = amount;

  if (unit === 'l') {
    maxValue = amount * 100000; // Lakhs
  } else if (unit === 'lc' || unit === 'c') {
    maxValue = amount * 10000000; // Crores
  }

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
  const { randomRange = 1000,length = 4 ,sliceLength = 6 } = options; // Destructure options with defaults
  const timestamp = Date.now(); // Get the current timestamp in milliseconds
  // const randomPart = Math.floor(Math.random() * randomRange); // Random number based on randomRange
  const randomPart = getFixedLengthRandomNumber(length);
  return parseInt(timestamp.toString().slice(-sliceLength) + randomPart); // Combine sliced timestamp with random part
}


function getFixedLengthRandomNumber(length) {
  const min = Math.pow(10, length - 1); // Smallest number with the given length
  const max = Math.pow(10, length) - 1; // Largest number with the given length
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

