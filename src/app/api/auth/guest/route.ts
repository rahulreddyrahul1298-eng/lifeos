import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST() {
  try {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const email = `${guestId}@guest.lifeos.app`;
    const hashedPassword = await hashPassword(guestId);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Guest User",
      },
    });

    const token = createToken(user.id);
    const response = NextResponse.json({ success: true });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Guest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
