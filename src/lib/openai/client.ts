import OpenAI from 'openai';

export function hasOpenAIEnv() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function createOpenAIClient() {
  if (!hasOpenAIEnv()) {
    return null;
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const openAIConfig = {
  chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  ttsModel: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
  ttsVoice: process.env.OPENAI_TTS_VOICE || 'alloy',
};
