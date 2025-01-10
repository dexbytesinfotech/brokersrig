import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js";
import { returnResponse } from "../response_formatter_js/index.js";
import { validateHeaders} from "../validate_functions/index.js";// Assuming this module exports `returnResponse`
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Environment variables
const _supabaseUrl = Deno.env.get('BASE_SUPABASE_URL');
const _supabaseAnonKey = Deno.env.get('BASE_SUPABASE_ANON_KEY');
// Email credentials
const email = 'shubham.dexbytes01@gmail.com';//Deno.env.get("SMTP_EMAIL"); // Your Gmail address
const password = 'shubham.tomar.dexbytes';//Deno.env.get("SMTP_PASSWORD"); // Your Gmail password or App Password
const RESEND_API_KEY = 're_cU332RWb_A2vmVFf49GRWrfQ1BoWKwMVy';

export async function sendEmail(userReqData){
  try {
 // Parse the request body
//  const { to, subject, body } = await req.json();
console.log('Failed to send email <><><><> ', userReqData);
 const { to, subject, body ,name } = userReqData;
 const resTemp = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: to,
      subject: "You have a new message!",
      html: `
          <div>
              <p>Hi ${name},</p>
              <p>${body}</p>
              <p>From: ${subject}</p>
          </div>
      `,
  }),
});
if (!resTemp.ok) {
  const data = await resTemp.json();
  console.error('Failed to send email ', data);
  return null;
}
const data = await resTemp.json();
return data;
}
catch (err) {
  console.error('Failed to send email ', err);
  return null;
}
}

// serve(async (req) => {

//  const client = new SmtpClient();
//   try {

//     const errors = validateHeaders("POST",req.headers);
//     if (errors.length > 0) {
//       return returnResponse(400,JSON.stringify({ error: "Validation failed", details: errors }),null);
//     }

//  // Parse the request body
//  const { to, subject, body } = await req.json();

//    // Connect to the SMTP server
//   //  await client.connect({
//   //   hostname: "smtp.gmail.com",
//   //   port: 587,
//   //   username: email,
//   //   password: password,
//   // });
//  // Email configuration
// //  const emailData = {
// //    from: email,
// //    to,
// //    subject,
// //    content: body,
// //  };
//  //465 smtp.googlemail.com
// //  const clientnew = await new SmtpClient({
// //   hostname: "smtp.gmail.com",
// //   port: 587,
  
// //   username: email,
// //   password: password,
// // });

// // await client.send(emailData);
// const resTemp = await fetch("https://api.resend.com/emails", {
//   method: "POST",
//   headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${RESEND_API_KEY}`,
//   },
//   body: JSON.stringify({
//       from: "onboarding@resend.dev",
//       to: to,
//       subject: "You have a new message!",
//       html: `
//           <div>
//               <p>Hi Deola,</p>
//               <p>${body}</p>
//               <p>From: ${subject}</p>
//           </div>
//       `,
//   }),
// });

// const data = await resTemp.json();
// // await client.close();
// console.log('Phone number exists:', data);
//       return returnResponse(200,`Success`,data);

//   } catch (err) {
//     console.error('Failed to send email ', err);
//     return new Response(`Server error: ${err.message}`, {
//       headers: { 'Content-Type': 'application/json' },
//       status: 500,
//     });
//   }
// });

