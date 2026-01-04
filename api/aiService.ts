export const OPENROUTER_API_KEY = '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';

export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: number;
};

export const getOptimizedTripContext = (details: any) => {
    if (!details) return 'No details available';

    // Extract only essential information to save tokens
    const simplifiedItinerary = details.itinerary?.map((day: any) => ({
        date: day.date,
        activities: day.activities?.map((act: any) => `${act.title || act.name || 'Activity'} (${act.startTime || ''})`)
    }));

    const placesOfInterest = (details.placesToVisit || []).slice(0, 10).map((p: any) =>
        `${p.name} (${p.types?.[0] || 'Place'})`
    ).join(', ');

    const travelerCount = details.travelers ? details.travelers.length : 1;

    const essentialData = {
        tripName: details.tripName,
        dates: `${details.startDate} to ${details.endDate} (${details.duration || '?'} days)`,
        travelers: `${travelerCount} person(s)`,
        budget: details.budget ? `${details.budget} (Total Limit)` : 'Not set',
        itinerary: simplifiedItinerary,
        placesToVisit: placesOfInterest,
        // expenses: details.expenses // Could add summary here if needed
    };

    return JSON.stringify(essentialData, null, 2);
};

export const generateSystemPrompt = (name: string, userDetails: any, tripDetails: any) => {
    return `You are an expert AI Travel Guide and Trip Planner assisting with a trip named "${name}".

    CONTEXT:
    1. USER PROFILE: 
       - Name: ${userDetails?.name || 'Traveler'}
       - Email: ${userDetails?.email || 'N/A'}
    
    2. TRIP DETAILS (JSON):
       ${getOptimizedTripContext(tripDetails)}

    ROLE & GOAL:
    - Act as a knowledgeable local guide and financial planner.
    - Your goal is to help the user request personalized advice based on their specific itinerary, budget, and group size.

    INSTRUCTIONS:
    instructions:
    1. **Personalization**: Address the user by name. Consider the group size (e.g., recommend family spots if > 2 people).
    2. **Detailed Itineraries**: When planning, break down days by Morning, Afternoon, and Evening.
    3. **Budget Breakdown**: ALWAYS estimate costs for:
       - Food (per meal)
       - Transport (best options for ${tripDetails?.travelers?.length || 1} people)
       - Entry Fees
    4. **Style**: FAIL-SAFE RULE: Do NOT use ANY emojis. Do NOT use special symbols like hashtags or asterisks other than standard Markdown bolding. Keep text strictly professional, clean, and simple.

    Help the user visualize their trip and manage their budget effectively.`;
};

export const sendChatRequest = async (messages: Message[]) => {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://travelplanner.app', // Required by OpenRouter
                'X-Title': 'TravelPlanner', // Required by OpenRouter
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                transforms: ["middle-out"], // Request compression from OpenRouter
                messages: messages.map(m => ({ role: m.role, content: m.content })),
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in sendChatRequest:', error);
        throw error;
    }
};
