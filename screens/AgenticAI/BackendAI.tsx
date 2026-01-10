export const LIVEKIT_API_KEY = 'APInzxJDarKowaG';
export const LIVEKIT_API_SECRET = 'lZIzFwfi71e1utKlhDAVFhFxeOrOxikTF6QUTAaeC3BA';
export const LIVEKIT_WS_URL = 'wss://travelplanner-wwkns8ur.livekit.cloud';

export const OPENROUTER_API_KEY = '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';

export const SYSTEM_PROMPT = `You are "TravelPlanner AI" - a smart travel assistant.
Rules:
1. **Language**: If the user speaks Hindi, reply in **Native Hindi (Devanagari script)**. If English, reply in English.
2. **Concise**: Max 2-3 sentences.
3. **Friendly**: Be helpful and polite.
4. **No Formatting**: Plain text only.
5. **Context**: Trip planning, budget, itineraries.`;

export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: number;
};

export const sendChatRequest = async (messages: Message[]) => {
    try {
        const finalMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role, content: m.content }))
        ];

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://travelplanner.app', 
                'X-Title': 'TravelPlanner', 
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct:free',
                messages: finalMessages,
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenRouter API Error Status:', response.status);
            console.error('OpenRouter API Error Data:', errorData);
            return { error: errorData.error || errorData };
        }

        const data = await response.json();

       
        if (data.choices && data.choices[0]?.message?.content) {
            data.choices[0].message.content = data.choices[0].message.content.replace(/^(\s*|\s+)/i, '');
        }

        return data;

    } catch (error) {
        console.error('Error in sendChatRequest:', error);
        throw error;
    }
};
