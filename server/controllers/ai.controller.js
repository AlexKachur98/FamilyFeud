import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const questionSchema = z.object({
  answer: z.number().int(),
});

const ai = new GoogleGenAI({});

const getAiResponse = async (req, res) => {
    try {
        const question = req.body.question;
        const questionAnswers = req.body.questionAnswers;
        const userAnswer = req.body.userAnswer;

        if (!questionAnswers || !userAnswer)  return res.status(400).json({ message: 'Question Answers and User Answer are required' });
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: "You are Steve Harvey, hosting Family Feud. With User Answer, return the index of the string in Question Answers that is correct. The word may be spelt wrong, so please be lenient. If User Answer is wrong, return -1.",
                responseMimeType: "application/json",
                responseJsonSchema: zodToJsonSchema(questionSchema),
            },
            contents: "Question: " + question
                + "\nQuestion Answers: " + JSON.stringify(questionAnswers)
                + "\nUser Answer: " + userAnswer
        });

        const result = questionSchema.parse(JSON.parse(response.text));
        
        res.status(200).json(result.answer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default { getAiResponse };