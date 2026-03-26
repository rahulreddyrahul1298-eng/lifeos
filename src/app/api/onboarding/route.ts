import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { income, budget, habits, goals } = await req.json();

    // Update user with income and budget
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        income: income || 0,
        budget: budget || 0,
        onboarded: true,
      },
    });

    // Create habits
    if (habits && habits.length > 0) {
      await prisma.habit.createMany({
        data: habits.map((name: string) => ({
          name,
          userId: payload.userId,
        })),
      });
    }

    // Create goals
    if (goals && goals.length > 0) {
      await prisma.goal.createMany({
        data: goals.map((title: string) => ({
          title,
          userId: payload.userId,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
