#!/usr/bin/env python3
# Align audio to word-level timestamps using WhisperX and save to sync_map
# Usage: python scripts/align_word_sync.py

import os, sys, json, re, uuid
from urllib.parse import urlparse

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("Please install psycopg2-binary: pip install psycopg2-binary")
    sys.exit(1)

try:
    import torch
    import whisperx  # pip install -U whisperx
except ImportError:
    print("Please install WhisperX and Torch: pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118 && pip install -U whisperx")
    sys.exit(1)

POSTGRES_URL = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")
if not POSTGRES_URL:
    print("POSTGRES_URL not set")
    sys.exit(1)

def pg_connect(url):
    u = urlparse(url)
    return psycopg2.connect(
        dbname=u.path.lstrip('/'),
        user=u.username,
        password=u.password,
        host=u.hostname,
        port=u.port or 5432,
        sslmode='require'
    )

def strip_html(html:str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()

def map_words_to_sections(words, sections_text):
    # words: list of {"word": str, "start": float(sec)}
    # sections_text: list of strings (plain text per section)
    lengths = [max(1, len(s)) for s in sections_text]
    total = sum(lengths)
    acc_chars = 0
    result = []
    idx_in_sec = 0
    sec_i = 0
    next_boundary = lengths[0]
    for w in words:
        while acc_chars >= next_boundary and sec_i < len(lengths) - 1:
            acc_chars = next_boundary
            sec_i += 1
            idx_in_sec = 0
            next_boundary += lengths[sec_i]
        result.append({
            "t": int(round((w.get("start", 0.0) or 0.0) * 1000)),
            "i": sec_i,
            "w": idx_in_sec,
            "text": w.get("word", "")
        })
        acc_chars += max(1, len(w.get("word", "")))
        idx_in_sec += 1
    return result

def main():
    # lightweight DB helpers to avoid long-lived connections (Neon/pgbouncer timeouts)
    def q(sql_text, params=None):
        conn = pg_connect(POSTGRES_URL)
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as c:
                c.execute(sql_text, params or ())
                return c.fetchall()
        finally:
            conn.close()

    def exec_sql(sql_text, params=None):
        conn = pg_connect(POSTGRES_URL)
        try:
            conn.autocommit = True
            with conn.cursor() as c:
                c.execute(sql_text, params or ())
        finally:
            conn.close()

    # Optional filter by slug via CLI: --slug <value> or env ONLY_SLUG
    only_slug = None
    if len(sys.argv) >= 3 and sys.argv[1] == "--slug":
        only_slug = sys.argv[2]
    if not only_slug:
        only_slug = os.getenv("ONLY_SLUG")

    if only_slug:
        items = q("select id, slug from item where slug=%s", (only_slug,))
    else:
        items = q("select id, slug from item")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"
    model = whisperx.load_model("small", device=device, compute_type=compute_type)
    align_model, metadata = whisperx.load_align_model(language_code="pt", device=device)

    project_root = os.getcwd()

    for it in items:
        track_rows = q("select \"audioUrl\", coalesce(\"durationMs\",0) as \"durationMs\" from audio_track where \"itemId\"=%s limit 1", (it["id"],))
        track = track_rows[0] if track_rows else None
        if not track:
            continue
        audio_url = track["audioUrl"] or ""
        if audio_url.startswith("/"):
            audio_path = os.path.join(project_root, "public" + audio_url)
        else:
            audio_path = audio_url
        if not os.path.exists(audio_path):
            print("Audio not found:", audio_path)
            continue

        # sections
        sections = q("select \"orderIndex\", coalesce(\"contentHtml\", '') as html from summary_section where \"itemId\"=%s order by \"orderIndex\"", (it["id"],))
        sections_plain = [strip_html(s["html"]) for s in sections] if sections else [""]

        # ASR + alignment
        audio = whisperx.load_audio(audio_path)
        asr = model.transcribe(audio, language="pt")
        aligned = whisperx.align(asr["segments"], align_model, metadata, audio, device)
        words = aligned.get("word_segments", [])
        if not words:
            print("No word segments for", it["slug"]) ; continue

        data = map_words_to_sections(words, sections_plain)
        exec_sql("delete from sync_map where \"itemId\"=%s", (it["id"],))
        exec_sql(
            "insert into sync_map (id, \"itemId\", granularity, data) values (%s,%s,%s,%s)",
            (str(uuid.uuid4()), it["id"], "word", json.dumps(data))
        )
        print("Word sync saved:", it["slug"], len(data), "words")


if __name__ == "__main__":
    main()





