/**
 * Speech-to-text for call recordings pulled from Ittisalna.
 *
 * Optional: only used when an interaction arrives with a recording URL but no transcript.
 * Provider: ElevenLabs Scribe (strong Arabic/Saudi dialect support, speaker diarization).
 * Set ELEVENLABS_API_KEY to enable. Any other provider can be dropped in here by keeping
 * the same signature.
 */

export function transcriptionConfigured(): boolean {
  return !!process.env["ELEVENLABS_API_KEY"];
}

interface ScribeWord {
  text: string;
  type?: string;
  speaker_id?: string;
}

export async function transcribeRecording(recordingUrl: string): Promise<string> {
  const key = process.env["ELEVENLABS_API_KEY"];
  if (!key) throw new Error("التفريغ الصوتي غير مفعّل (ELEVENLABS_API_KEY)");

  const audio = await fetch(recordingUrl);
  if (!audio.ok) throw new Error(`تعذر تحميل التسجيل (${audio.status})`);
  const blob = await audio.blob();

  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("language_code", "ara");
  form.append("diarize", "true");
  form.append("file", blob, "call.mp3");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": key },
    body: form,
  });
  if (!res.ok) throw new Error(`فشل التفريغ الصوتي (${res.status})`);
  const data = (await res.json()) as { text: string; words?: ScribeWord[] };

  // Rebuild a speaker-labelled transcript when diarization is available.
  if (!data.words?.length || !data.words.some((w) => w.speaker_id)) return data.text;
  const lines: string[] = [];
  let speaker = "";
  let buf = "";
  for (const w of data.words) {
    if (w.type === "audio_event") continue;
    const s = w.speaker_id ?? speaker;
    if (s !== speaker && buf.trim()) {
      lines.push(`${label(speaker)}: ${buf.trim()}`);
      buf = "";
    }
    speaker = s;
    buf += w.text;
  }
  if (buf.trim()) lines.push(`${label(speaker)}: ${buf.trim()}`);
  return lines.join("\n");
}

// Speakers come back as speaker_0 / speaker_1. The agent answers inbound calls first,
// so speaker_0 is usually the agent; the evaluator is told the transcript may be imperfect.
const label = (s: string) => (s === "speaker_0" ? "المتحدث 1" : s === "speaker_1" ? "المتحدث 2" : "متحدث");
