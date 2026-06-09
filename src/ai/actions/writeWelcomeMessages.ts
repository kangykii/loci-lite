import { callOpenAIJson } from '../providers/openai';

export type WelcomeMessagesResult = {
  messages: string[];
  sourceWasWriting: boolean;
};

type WelcomeMessagesPayload = {
  messages?: unknown;
  sourceWasWriting?: unknown;
};

type WriteWelcomeMessagesInput = {
  apiKey: string;
  title: string;
  markdown: string;
};

const MAX_MARKDOWN_CHARS = 8000;

function normalizeMessages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((message): message is string => typeof message === 'string')
    .map((message) => message.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function writeWelcomeMessages({
  apiKey,
  title,
  markdown,
}: WriteWelcomeMessagesInput): Promise<WelcomeMessagesResult> {
  const payload = (await callOpenAIJson({
    apiKey,
    system:
      'You are Loci, a quiet writing companion inside a local-first markdown editor. Respond only as JSON.',
    user: `Skim the document below. Decide whether it seems like a piece of writing/prose rather than scratch notes, checklists, tables, or code.

If it is writing, write 5 distinct welcome messages addressed to the user as they return to this document. Each message should feel like the beginning of a typewritten page: calm, specific to the document's mood, and 2-4 sentences. Loci may speak in first person, but should not summarize too literally or mention being an AI.

If it is not writing, set sourceWasWriting to false and write 5 gentle generic writing prompts instead.

Return exactly this JSON shape:
{"sourceWasWriting":true,"messages":["message 1","message 2","message 3","message 4","message 5"]}

Title: ${title}

Markdown:
${markdown.slice(0, MAX_MARKDOWN_CHARS)}`,
  })) as WelcomeMessagesPayload;

  const messages = normalizeMessages(payload.messages);
  if (messages.length !== 5) {
    throw new Error('OpenAI did not return five welcome messages.');
  }

  return {
    messages,
    sourceWasWriting: payload.sourceWasWriting === true,
  };
}
