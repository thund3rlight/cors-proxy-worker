const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      const requestUrl = new URL(request.url);

      let target = requestUrl.searchParams.get("url");

      if (!target) {
        target = requestUrl.pathname.slice(1);
      }

      if (!target) {
        return new Response("Missing target URL", {
          status: 400,
          headers: corsHeaders,
        });
      }

      target = decodeURIComponent(target);

      if (
        !target.startsWith("http://") &&
        !target.startsWith("https://")
      ) {
        target = `https://${target}`;
      }

      const targetUrl = new URL(target);

      // Block local/internal hosts
      if (
        [
          "localhost",
          "127.0.0.1",
          "0.0.0.0",
        ].includes(targetUrl.hostname)
      ) {
        return new Response("Blocked host", {
          status: 403,
          headers: corsHeaders,
        });
      }

      const headers = new Headers(request.headers);

      headers.delete("host");
      headers.delete("cf-connecting-ip");
      headers.delete("x-forwarded-for");
      headers.delete("x-real-ip");

      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers,
        body:
          request.method === "GET" ||
          request.method === "HEAD"
            ? undefined
            : request.body,
        redirect: "follow",
      });

      const responseHeaders = new Headers(response.headers);

      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(error.toString(), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};