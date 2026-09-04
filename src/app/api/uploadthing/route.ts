import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    callbackUrl: process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/uploadthing`
      : "http://localhost:3000/api/uploadthing",
  }
});
