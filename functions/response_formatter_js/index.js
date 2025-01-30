

// Function that returns either a string or a number
// Function that returns either a string or a number
export function returnResponse(statusCode, message, data) {
  return new Response(JSON.stringify({ 
      status_code: statusCode, 
      message: message, 
      result: data 
  }), {
      headers: { 
        'Content-Type': 'application/json'
       },
      status: statusCode,
  });
}

