type OpenAIJsonRequest = {
  apiKey: string;
  system: string;
  user: string;
  model?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function callOpenAIJson({
  apiKey,
  system,
  user,
  model = 'gpt-4o-mini',
}: OpenAIJsonRequest): Promise<unknown> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error('OpenAI API key is required.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${trimmedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'OpenAI request failed.');
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned invalid JSON.');
  }
}
