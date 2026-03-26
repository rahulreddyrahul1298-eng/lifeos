import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isPremium: true },
      });
    } catch (error) {
      console.error("Failed to upgrade user:", error);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/dashboard?upgraded=true`);
}
