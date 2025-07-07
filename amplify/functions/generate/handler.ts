import { env } from "$amplify/env/generate"
import { Schema } from "../../data/resource";
import { GoogleGenAI } from "@google/genai";


export const handler: Schema["Generate"]["functionHandler"] = async (event) => {
    const GOOGLE_API_KEY = env.GOOGLE_API_KEY;
    const { originPrompt, model, systemPrompt, temperature } = event.arguments

    if (!originPrompt) {
        console.error('Invalid input');
        return { data: null, error: 'Invalid input' };
    }
    try {


        const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
        const response = await ai.models.generateContent({
            model: model || "gemini-2.0-flash",
            contents: originPrompt,
            config: {
                systemInstruction: systemPrompt || '',
                temperature: temperature || 1,
            },
        });

        if (!response.text || response.text === '') {
            console.error('Помилка завантаження відповіді');
            return { data: null, error: 'Помилка завантаження відповіді' };
        }
        return ({ data: response.text, error: null });

    } catch (e) {
        console.error(e);
        return { data: null, error: 'Помилка при отриманні даних від сервера: ' + (e as Error).message };
    }
};