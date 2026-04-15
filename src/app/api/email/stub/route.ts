import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "stub_only",
      message: "Full email sync is out of scope for this MVP. Use the web form or Twilio SMS intake."
    },
    { status: 202 }
  );
}
