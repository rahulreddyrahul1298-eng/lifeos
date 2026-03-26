import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token)?.userId || null;
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();
  if (!title)
    return NextResponse.json({ error: "Title required" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: { title, userId },
  });

  return NextResponse.json(goal);
}

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, completed } = await req.json();
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  const goal = await prisma.goal.updateMany({
    where: { id, userId },
    data: { completed },
  });

  return NextResponse.json(goal);
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.goal.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
