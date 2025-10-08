import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}

const sql = postgres(url);

async function main() {
  const [items, tracks, sections, syncs] = await Promise.all([
    sql`select count(*)::int as c from "item"`,
    sql`select count(*)::int as c from "audio_track"`,
    sql`select count(*)::int as c from "summary_section"`,
    sql`select count(*)::int as c from "sync_map"`,
  ]);
  const sample = await sql`
    select i.slug,
           count(distinct s.id)::int as sections,
           count(distinct t.id)::int as tracks
    from item i
    left join summary_section s on s."itemId"=i.id
    left join audio_track t on t."itemId"=i.id
    group by i.slug
    order by sections desc
    limit 5
  `;
  console.log(
    JSON.stringify(
      {
        counts: {
          items: items[0].c,
          audio_tracks: tracks[0].c,
          sections: sections[0].c,
          sync_maps: syncs[0].c,
        },
        sample,
      },
      null,
      2,
    ),
  );
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});
