import { NextResponse } from "next/server";
import { runFollowupAutomation } from "@/lib/followups";

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const receivedSecret = request.headers.get("x-cron-secret");

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFollowupAutomation();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Follow-up job failed" },
      { status: 500 }
    );
  }
}
