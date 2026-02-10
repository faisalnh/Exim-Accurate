import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  try {
    const credentials = await prisma.accurateCredentials.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        appKey: true,
        host: true,
        createdAt: true,
      },
    });

    return NextResponse.json(credentials);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P1001"
    ) {
      return NextResponse.json(
        { error: "Database tidak dapat diakses. Coba lagi beberapa saat." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Gagal memuat daftar kredensial." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
  }

  try {
    await prisma.accurateCredentials.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal menghapus kredensial" },
      { status: 500 },
    );
  }
}
