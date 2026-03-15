import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const FISH_SPEECH_VERSION = "f81057e21ad025b00703b8a2f63283d108829b7512f85c4c723c3edcc125f1bc";

const CHARACTER_LIMIT = 500;

/**
 * Humanize text to make TTS sound more natural.
 */
function humanizeText(text: string): string {
    return text
        .replace(/\b(So|Well|Now|Look|Actually|Honestly|Basically|Right|Okay|Alright|You know|I mean|Listen)\b(?!,)/gi, '$1,')
        .replace(/\.{3}/g, ', ')
        .replace(/,{2,}/g, ',')
        .replace(/ {2,}/g, ' ')
        .trim();
}

/**
 * Auto-transcribe reference audio using Replicate's Whisper model.
 */
async function transcribeAudio(voiceAudio: string): Promise<string> {
    console.log('[voice-clone] Transcribing reference audio with Replicate Whisper...');

    const output = await replicate.run(
        "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e",
        {
            input: {
                audio: voiceAudio,
                model: "large-v2",
                language: "en",
                transcription: "plain text",
            }
        }
    ) as any;

    const transcript = output?.transcription || output?.text || '';
    console.log('[voice-clone] Whisper transcript:', transcript);

    if (!transcript) {
        throw new Error('Could not transcribe reference audio. Please try a clearer recording.');
    }

    return transcript;
}

/**
 * Fish Speech v1.5 — best open-source voice cloning
 */
async function runFishSpeech(voiceAudio: string, text: string): Promise<string> {
    const textReference = await transcribeAudio(voiceAudio);

    console.log('[voice-clone] Fish Speech v1.5 started...');
    const prediction = await replicate.predictions.create({
        version: FISH_SPEECH_VERSION,
        input: {
            text,
            speaker_reference: voiceAudio,
            text_reference: textReference,
        }
    });

    await replicate.wait(prediction);
    const result = await replicate.predictions.get(prediction.id);

    let audio = result.output;
    if (typeof audio === 'object' && audio !== null) {
        audio = audio.audio ?? audio.url ?? audio.output ?? Object.values(audio)[0];
    }

    if (!audio) throw new Error('No audio returned from Fish Speech.');
    return audio as string;
}

export async function POST(req: Request) {
    try {
        const { voiceAudio, text } = await req.json();

        // 1. Verify Authentication via Authorization Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Auth header missing.' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
        }

        const userId = user.id;

        if (!voiceAudio || !text) {
            return NextResponse.json({ error: 'Voice sample and text are required.' }, { status: 400 });
        }

        if (text.length > CHARACTER_LIMIT) {
            return NextResponse.json({ error: `Text too long. Maximum ${CHARACTER_LIMIT} characters allowed.` }, { status: 400 });
        }

        // 2. Check user credits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Could not fetch user profile.' }, { status: 500 });
        }

        if (profile.credits < 1) {
            return NextResponse.json({ error: 'Insufficient credits. Please Top Up.' }, { status: 403 });
        }

        const humanizedText = humanizeText(text);

        // 3. Perform AI generation
        const audioUrl = await runFishSpeech(voiceAudio, humanizedText);

        // 4. Deduct credit after successful generation
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: profile.credits - 1 })
            .eq('id', userId);

        if (updateError) {
            console.error('[voice-clone] Credit deduction error:', updateError);
        }

        return NextResponse.json({ url: audioUrl });

    } catch (error: any) {
        console.error('[voice-clone] Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to process Voice Clone.' },
            { status: 500 }
        );
    }
}
