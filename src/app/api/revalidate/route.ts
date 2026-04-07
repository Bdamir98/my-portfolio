import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const path = body.path || "/work";
    revalidatePath(path);

    // Also revalidate the homepage
    revalidatePath("/");

    return NextResponse.json({ revalidated: true, path, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
