import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";
import { NextResponse } from "next/server";

const handler = createRouteHandler({
  router: ourFileRouter,
});

export async function GET(req: Request) {
  return handler.GET(req);
}

export async function POST(req: Request) {
  try {
    const res = await handler.POST(req);
    if (!res.ok) {
      const body = await res.clone().text();
      console.error("UPLOADTHING POST FAILED:", res.status, body);
    }
    return res;
  } catch (error: any) {
    console.error("UPLOADTHING POST EXCEPTION:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
