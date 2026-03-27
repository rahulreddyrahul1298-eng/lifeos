import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token)?.userId || null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bankName, accountHolder, accountNumber, ifscCode, accountType, isPrimary } = await req.json();
  if (!bankName || !accountHolder || !accountNumber || !ifscCode) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // If this is set as primary, unset others
  if (isPrimary) {
    await prisma.bankAccount.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });
  }

  const account = await prisma.bankAccount.create({
    data: {
      bankName,
      accountHolder,
      accountNumber,
      ifscCode,
      accountType: accountType || "Savings",
      isPrimary: isPrimary || false,
      userId,
    },
  });

  return NextResponse.json(account);
}

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, bankName, accountHolder, accountNumber, ifscCode, accountType, isPrimary } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  if (isPrimary) {
    await prisma.bankAccount.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });
  }

  await prisma.bankAccount.updateMany({
    where: { id, userId },
    data: {
      ...(bankName && { bankName }),
      ...(accountHolder && { accountHolder }),
      ...(accountNumber && { accountNumber }),
      ...(ifscCode && { ifscCode }),
      ...(accountType && { accountType }),
      ...(isPrimary !== undefined && { isPrimary }),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.bankAccount.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
