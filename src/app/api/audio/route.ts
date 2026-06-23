import { NextRequest } from "next/server";
import OpenAI from "openai";
import { z, ZodError } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { createBookRepository } from "@/lib/books/repository";
import { clientEnv, serverEnv } from "@/lib/env";
import { canAccessFeature } from "@/lib/permissions";
import {
  createServerSupabaseClient,
  createServiceSupabaseClient,
} from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { AppUser, Book } from "@/types";

const audioRequestSchema = z.object({
  bookSlug: z.string().min(1, "El libro es requerido."),
  metadataOnly: z.boolean().default(false),
});

type AudioAssetInsert = Database["public"]["Tables"]["audio_assets"]["Insert"];

function getFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

async function getAuthenticatedUser(
  request: NextRequest,
): Promise<{ accessToken: string; user: AppUser } | null> {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return null;
  }

  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return null;
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data: authData, error: authError } =
    await supabase.auth.getUser(accessToken);

  if (authError || !authData.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, plan")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return {
    accessToken,
    user: {
      id: authData.user.id,
      email: authData.user.email ?? "",
      fullName: profile.full_name ?? "Usuario",
      plan: profile.plan,
      isDemo: false,
    },
  };
}

function getAudioConfig() {
  if (!serverEnv.OPENAI_API_KEY || !serverEnv.OPENAI_TTS_MODEL) {
    throw new Error("OpenAI TTS no está configurado.");
  }

  return {
    apiKey: serverEnv.OPENAI_API_KEY,
    bucket: serverEnv.STORAGE_BUCKET || "audio-assets",
    model: serverEnv.OPENAI_TTS_MODEL,
    voice: (serverEnv.OPENAI_TTS_VOICE ?? "ash").toLowerCase(),
  };
}

function buildAudioScript(book: Book) {
  const keyPoints = book.keyPoints
    .slice(0, 5)
    .map((point) => `${point.number}. ${point.title}. ${point.explanation}`)
    .join("\n");
  const activity = book.activities[0]
    ? `Ejercicio sugerido: ${book.activities[0].title}. ${book.activities[0].prompt}`
    : "Ejercicio sugerido: elige una idea y aplícala hoy durante diez minutos.";
  const script = `Audio editorial de Ceoteca sobre ${book.title}, de ${book.author}.

${book.description}

Ideas clave:
${keyPoints}

${book.conclusion}

${activity}

Recuerda: este audio complementa tu lectura y no reemplaza la obra original. Si el tema conecta contigo, profundiza en el libro completo mediante una edición legal.`;

  return script.slice(0, 4000);
}

function estimateDurationSeconds(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;

  return Math.max(45, Math.ceil((words / 155) * 60));
}

async function ensureAudioBucket(bucket: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase.storage.listBuckets();

  if (data?.some((item) => item.name === bucket)) {
    return;
  }

  await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["audio/mpeg"],
  });
}

async function createSignedUrl(bucket: string, storagePath: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "No se pudo crear la URL del audio.");
  }

  return data.signedUrl;
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedUser(request);

  if (!session) {
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para escuchar audio." },
      401,
    );
  }

  if (!canAccessFeature(session.user.plan, "audio")) {
    return jsonError(
      {
        code: "AUDIO_NOT_INCLUDED",
        message: "Tu plan actual no incluye audio narrado.",
      },
      403,
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(
      { code: "INVALID_INPUT", message: "El cuerpo de la solicitud no es JSON válido." },
      400,
    );
  }

  const parsed = audioRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Revisa los campos enviados.",
        fieldErrors: getFieldErrors(parsed.error),
      },
      400,
    );
  }

  const book = await createBookRepository().getBySlug(parsed.data.bookSlug);

  if (!book || !book.isPublished) {
    return jsonError(
      { code: "BOOK_NOT_FOUND", message: "No encontramos este libro." },
      404,
    );
  }

  const bucket = serverEnv.STORAGE_BUCKET || "audio-assets";
  const serviceSupabase = createServiceSupabaseClient();
  const uploadedAudioResponse = await serviceSupabase
    .from("audio_assets")
    .select("*")
    .eq("book_id", book.id)
    .eq("status", "ready")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (uploadedAudioResponse.error) {
    return jsonError(
      {
        code: "AUDIO_LOOKUP_FAILED",
        message: "No pudimos consultar el audio de este libro.",
      },
      500,
    );
  }

  if (uploadedAudioResponse.data) {
    const signedUrl = await createSignedUrl(
      bucket,
      uploadedAudioResponse.data.storage_path,
    );

    return jsonData({
      audioUrl: signedUrl,
      durationSeconds: uploadedAudioResponse.data.duration_seconds,
      cached: true,
    });
  }

  const configuredModel = serverEnv.OPENAI_TTS_MODEL;
  const configuredVoice = (serverEnv.OPENAI_TTS_VOICE ?? "ash").toLowerCase();
  const existingResponse = configuredModel
    ? await serviceSupabase
        .from("audio_assets")
        .select("*")
        .eq("book_id", book.id)
        .eq("model", configuredModel)
        .eq("voice", configuredVoice)
        .eq("status", "ready")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };

  if (existingResponse.error) {
    return jsonError(
      {
        code: "AUDIO_LOOKUP_FAILED",
        message: "No pudimos consultar el audio de este libro.",
      },
      500,
    );
  }

  if (existingResponse.data) {
    const signedUrl = await createSignedUrl(bucket, existingResponse.data.storage_path);

    return jsonData({
      audioUrl: signedUrl,
      durationSeconds: existingResponse.data.duration_seconds,
      cached: true,
    });
  }

  if (parsed.data.metadataOnly) {
    return jsonError(
      {
        code: "AUDIO_NOT_READY",
        message: "El audio de este libro todavía no está disponible.",
      },
      404,
    );
  }

  const { apiKey, model, voice } = getAudioConfig();
  const storagePath = `books/${book.slug}/${model}-${voice}.mp3`;
  const insertPayload: AudioAssetInsert = {
    book_id: book.id,
    storage_path: storagePath,
    voice,
    model,
    duration_seconds: null,
    status: "processing",
  };
  const insertResponse = await serviceSupabase
    .from("audio_assets")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertResponse.error) {
    return jsonError(
      {
        code: "AUDIO_JOB_FAILED",
        message: "No pudimos preparar la generación del audio.",
      },
      500,
    );
  }

  const assetId = insertResponse.data.id;

  try {
    await ensureAudioBucket(bucket);

    const script = buildAudioScript(book);
    const openai = new OpenAI({ apiKey });
    const audio = await openai.audio.speech.create({
      model,
      voice,
      input: script,
      instructions:
        "Narración cálida, clara y profesional para una plataforma educativa en español. Ritmo pausado, tono premium y cercano.",
      response_format: "mp3",
    });
    const audioBuffer = Buffer.from(await audio.arrayBuffer());
    const uploadResponse = await serviceSupabase.storage
      .from(bucket)
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadResponse.error) {
      throw new Error(uploadResponse.error.message);
    }

    const durationSeconds = estimateDurationSeconds(script);
    const updateResponse = await serviceSupabase
      .from("audio_assets")
      .update({
        duration_seconds: durationSeconds,
        status: "ready",
      })
      .eq("id", assetId);

    if (updateResponse.error) {
      throw new Error(updateResponse.error.message);
    }

    const signedUrl = await createSignedUrl(bucket, storagePath);

    return jsonData({
      audioUrl: signedUrl,
      durationSeconds,
      cached: false,
    });
  } catch {
    await serviceSupabase
      .from("audio_assets")
      .update({ status: "failed" })
      .eq("id", assetId);

    return jsonError(
      {
        code: "TTS_PROVIDER_ERROR",
        message: "No pudimos generar el audio en este momento.",
      },
      502,
    );
  }
}
