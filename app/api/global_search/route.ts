import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/dbClient";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const queryParams = request.nextUrl.searchParams;
  const organizationId = queryParams.get("organizationId");
  const search = queryParams.get("search") ?? "";

  if (!organizationId) {
    return NextResponse.json(
      { error: "Missing organizationId" },
      { status: 400 }
    );
  }

  if (search === "") {
    return NextResponse.json({ data: [] });
  }

  let searchKeys: any = search.split(" ");

  searchKeys[searchKeys.length - 1] = `${searchKeys[searchKeys.length - 1]}:*`;

  searchKeys = searchKeys.join(":* & ");

  const sessions = await db.execute(
    sql.raw(
      `select * from "bardSession" where fts @@ to_tsquery('simple', '${searchKeys}') and organization_id = '${organizationId}'`
    )
  );

  const tracks = await db.execute(
    sql.raw(
      `select * from "spotifyTrack" where fts @@ to_tsquery('simple', '${searchKeys}') and organization_id = '${organizationId}'`
    )
  );

  return NextResponse.json({ data: [sessions, tracks] });
}
