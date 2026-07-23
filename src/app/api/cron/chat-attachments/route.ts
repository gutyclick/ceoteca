import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { cleanupTemporaryAttachments } from "@/lib/chat/attachments/service";
import { serverEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  if (
    !serverEnv.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${serverEnv.CRON_SECRET}`
  ) {
    return jsonError({ code: "UNAUTHORIZED", message: "Cron no autorizado." }, 401);
  }
  return jsonData({ removed: await cleanupTemporaryAttachments() });
}
