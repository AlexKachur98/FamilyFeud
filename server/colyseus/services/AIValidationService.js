/**
 * @file AIValidationService.js
 * @author Alex Kachur
 * @since 2025-12-09
 * @description AI-powered answer validation using Google Gemini.
 *
 * Validates player answers against the question's answer list using fuzzy matching.
 * Handles misspellings, synonyms, and partial matches. Falls back to simple string
 * matching if AI is unavailable or times out (5 second timeout).
 */
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const answerSchema = z.object({
    index: z.number().int().min(-1).max(7),
    answer: z.string().default(null).nullable(),
    points: z.number().int().default(null).nullable()
});

let ai = null;

// Timeout for AI requests (5 seconds)
const AI_TIMEOUT_MS = 5000;

/**
 * Initialize the Google GenAI client
 */
function getAIClient() {
    if (!ai && process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
    }
    return ai;
}

/**
 * Promise wrapper with timeout
 */
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI request timed out')), ms)
        )
    ]);
}

/**
 * AI Validation Service
 * Validates player answers using Gemini AI for fuzzy matching
 */
export class AIValidationService {
    /**
     * Validate a user's answer against the question's answers
     * @param {string} questionText - The question text
     * @param {Array} answers - Array of {text, points} answer objects
     * @param {string} userAnswer - The user's submitted answer
     * @returns {Promise<{index: number, answer: string|null, points: number|null}>}
     */
    static async validateAnswer(questionText, answers, userAnswer) {
        const client = getAIClient();

        // If no AI client, fall back to simple matching
        if (!client) {
            console.warn('AI client not available, using fallback matching');
            return AIValidationService.fallbackMatch(answers, userAnswer);
        }

        try {
            const prompt = `
                You are Steve Harvey, hosting Family Feud.
                With User Answer, return the index, answer and points of the object in Question Answers that has the correct answer.
                The User Answer may be spelt wrong, so please be lenient.
                If User Answer is wrong, only return index -1.
            `;

            // Format answers for AI
            const formattedAnswers = answers.map((a, idx) => ({
                index: idx,
                answer: a.text || a.answer,
                points: a.points
            }));

            const content = `
                Question: ${questionText}
                Question Answers: ${JSON.stringify(formattedAnswers)}
                User Answer: ${userAnswer}
            `;

            const response = await withTimeout(
                client.models.generateContent({
                    model: "gemini-2.5-flash-lite",
                    config: {
                        systemInstruction: prompt,
                        responseMimeType: "application/json",
                        responseJsonSchema: zodToJsonSchema(answerSchema),
                    },
                    contents: content
                }),
                AI_TIMEOUT_MS
            );

            let parsed;
            try {
                parsed = JSON.parse(response?.text ?? '{}');
            } catch (parseError) {
                console.error('Gemini response parse failed', { parseError, raw: response?.text });
                return AIValidationService.fallbackMatch(answers, userAnswer);
            }

            const result = answerSchema.parse(parsed);
            return result;

        } catch (error) {
            console.error('AI validation failed:', error.message);
            // Fall back to simple matching on error
            return AIValidationService.fallbackMatch(answers, userAnswer);
        }
    }

    /**
     * Simple fallback matching when AI is unavailable
     * Uses basic string comparison with normalization
     */
    static fallbackMatch(answers, userAnswer) {
        const normalizedInput = userAnswer.toLowerCase().trim();

        for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            const answerText = answer.text || answer.answer || '';
            const normalizedAnswer = answerText.toLowerCase().trim();

            // Exact match
            if (normalizedAnswer === normalizedInput) {
                return { index: i, answer: answerText, points: answer.points };
            }

            // Contains match (either direction)
            if (normalizedAnswer.includes(normalizedInput) || normalizedInput.includes(normalizedAnswer)) {
                return { index: i, answer: answerText, points: answer.points };
            }

            // Word-based matching (at least 2 words match)
            const inputWords = normalizedInput.split(/\s+/).filter(w => w.length > 2);
            const answerWords = normalizedAnswer.split(/\s+/).filter(w => w.length > 2);

            if (inputWords.length > 0 && answerWords.length > 0) {
                const matchingWords = inputWords.filter(word =>
                    answerWords.some(aw => aw.includes(word) || word.includes(aw))
                );
                if (matchingWords.length >= Math.min(2, inputWords.length)) {
                    return { index: i, answer: answerText, points: answer.points };
                }
            }
        }

        return { index: -1, answer: null, points: null };
    }
}

export default AIValidationService;
