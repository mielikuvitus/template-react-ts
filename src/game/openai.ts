const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a helpful AI NPC in a 2D platformer game. The player can ask you for help when they're stuck. Keep your responses short (1-3 sentences max), friendly, and game-relevant. You can give hints about movement (arrow keys/WASD to move, W/Up to jump), the level layout, enemies, pickups, and the exit. Stay in character as a cheerful game companion.`;

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/** Maintains conversation history for context */
const conversationHistory: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT }
];

export async function askNPC(userMessage: string): Promise<string> {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-api-key-here') {
        return '(No API key set — add your key to .env as VITE_OPENAI_API_KEY)';
    }

    conversationHistory.push({ role: 'user', content: userMessage });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: conversationHistory,
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('OpenAI API error:', err);
            return `(API error: ${response.status})`;
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content?.trim() ?? '(No response)';

        conversationHistory.push({ role: 'assistant', content: reply });

        // Keep history manageable (system + last 10 exchanges)
        if (conversationHistory.length > 21) {
            conversationHistory.splice(1, 2);
        }

        return reply;
    } catch (err) {
        console.error('OpenAI fetch failed:', err);
        return '(Failed to reach AI — check your connection)';
    }
}
