import { NextResponse } from "next/server";
import { getErrorMessage, isAppConfigError } from "@/lib/errors";
import { runFollowupAutomation } from "@/lib/followups";

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const receivedSecret = request.headers.get("x-cron-secret");

  if (!expectedSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }

  if (receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFollowupAutomation();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Follow-up job failed") },
      { status: isAppConfigError(error) ? 503 : 500 }
    );
  }
}
