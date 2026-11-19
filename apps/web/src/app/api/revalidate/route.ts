import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const PATHS = [
  "/",
  "/products",
  "/woman",
  "/man",
  "/children",
  "/thrifted",
  "/thrifted/standard",
  "/thrifted/plus-size",
  "/sizing-guide",
  "/contact",
  "/journal",
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  for (const path of PATHS) {
    revalidatePath(path);
  }
  // Also revalidate the root layout so shared components (nav, footer) refresh
  revalidatePath("/", "layout");

  return NextResponse.json({ revalidated: true, paths: PATHS, now: Date.now() });
}
