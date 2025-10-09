import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';

const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  try {
    // Get all items with multiple audio tracks
    const res = await client.query(`
      SELECT
        i.id as item_id,
        i.title,
        at.id as track_id,
        at."audioUrl",
        at."durationMs"
      FROM item i
      INNER JOIN audio_track at ON at."itemId" = i.id
      WHERE i.id IN (
        SELECT "itemId"
        FROM audio_track
        GROUP BY "itemId"
        HAVING COUNT(*) > 1
      )
      ORDER BY i.title, at."durationMs" DESC
    `);

    const grouped = {};
    res.rows.forEach(row => {
      if (!grouped[row.item_id]) {
        grouped[row.item_id] = {
          title: row.title,
          tracks: []
        };
      }
      grouped[row.item_id].tracks.push({
        track_id: row.track_id,
        audioUrl: row.audioUrl,
        durationMs: row.durationMs
      });
    });

    // For each item, keep the longest track (assuming it's the better version)
    const toDelete = [];
    Object.entries(grouped).forEach(([itemId, data]) => {
      // Sort by duration DESC, keep first (longest), delete rest
      const sorted = data.tracks.sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0));
      const [keep, ...remove] = sorted;

      console.log(`\n📚 ${data.title}`);
      console.log(`  ✅ Mantendo: ${keep.audioUrl} (${Math.round(keep.durationMs / 60000)}min)`);

      remove.forEach(track => {
        console.log(`  ❌ Removendo: ${track.audioUrl} (${Math.round(track.durationMs / 60000)}min)`);
        toDelete.push({
          item_id: itemId,
          title: data.title,
          track_id: track.track_id,
          audioUrl: track.audioUrl,
          durationMs: track.durationMs
        });
      });
    });

    console.log(`\n\n📊 Total: ${toDelete.length} faixas para remover\n`);

    if (toDelete.length === 0) {
      console.log('Nenhuma faixa duplicada encontrada.');
      await client.end();
      return;
    }

    // Delete from database
    console.log('🗑️  Removendo do banco de dados...');
    for (const track of toDelete) {
      await client.query('DELETE FROM audio_track WHERE id = $1', [track.track_id]);
      console.log(`  ✓ Removido do DB: ${track.track_id}`);
    }

    // Delete audio files
    console.log('\n🗑️  Removendo arquivos de áudio...');
    const publicDir = process.cwd();

    for (const track of toDelete) {
      try {
        // audioUrl format: /media/audio/filename.wav
        const filePath = path.join(publicDir, 'public', track.audioUrl);

        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log(`  ✓ Arquivo removido: ${track.audioUrl}`);
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.log(`  ⚠️  Arquivo não encontrado: ${track.audioUrl}`);
          } else {
            throw err;
          }
        }
      } catch (err) {
        console.error(`  ✗ Erro ao remover ${track.audioUrl}:`, err.message);
      }
    }

    console.log('\n✅ Remoção concluída!');

  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
