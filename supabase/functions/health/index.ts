import { corsHeaders } from "../_shared/cors.ts";

Deno.serve((request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return Response.json(
    {
      service: "kynovia-access",
      status: "ok"
    },
    {
      headers: corsHeaders
    }
  );
});
