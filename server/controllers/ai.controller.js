import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import QuestionModel from '../models/question.model.js';

const questionSchema = z.object({
    index: z.number().int().min(-1).max(7),
    answer: z.string().default(null).nullable(),
    points: z.number().int().default(null).nullable()
});

const ai = new GoogleGenAI({});

const getAiResponse = async (req, res) => {
    try {
        const userAnswer = req.body.userAnswer;
        if (!userAnswer)  return res.status(400).json({ message: 'User Answer is required' });

        const questionId = req.params.questionId;
        const questionObj = await QuestionModel.findById(questionId);
        if (!questionObj) return res.status(404).json({ message: 'Question not found' });

        const prompt = `
            You are Steve Harvey, hosting Family Feud. 
            With User Answer, return the index, answer and points of the object in Question Answers that has the correct answer. 
            The User Answer may be spelled wrong, so please be lenient. 
            If User Answer is wrong, return index -1.
        `;

        const content = `
            Question: ${questionObj.question}
            Question Answers: ${JSON.stringify(questionObj.answers)}
            User Answer: ${userAnswer}
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: prompt,
                responseMimeType: "application/json",
                responseJsonSchema: zodToJsonSchema(questionSchema),
            },
            contents: content
        });

        const result = questionSchema.parse(JSON.parse(response.text));
        
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid AI response format' });
        res.status(500).json({ message: error.message });
    }
};

export default { getAiResponse };