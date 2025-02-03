

// Function that returns either a string or a number
// Function that returns either a string or a number
export function returnResponse(statusCode, message, data) {
  return new Response(JSON.stringify({ 
      status_code: statusCode, 
      message: message, 
      result: data 
  }), {
      headers: { 
        "Access-Control-Allow-Origin": "*", // Allow all domains
        'Content-Type': 'application/json'
       },
      status: statusCode,
  });
}

