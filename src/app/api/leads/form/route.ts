import { NextResponse } from "next/server";
import { createLeadFromInbound, mapFormInputToIntake } from "@/lib/intake";
import { leadFormSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = leadFormSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead form payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createLeadFromInbound(mapFormInputToIntake(parsed.data));
    return NextResponse.json({ lead_id: result.lead.id, conversation_id: result.conversation.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lead intake failed" },
      { status: 500 }
    );
  }
}
