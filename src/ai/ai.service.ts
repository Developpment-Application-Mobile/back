import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(
      'AIzaSyBueMiS891B9BXVqBDXhy_EmUR5S4KtPag',
    );
  }

  async generateQuiz(
    subject: string,
    difficulty: string,
    numQuestions: number,
    topic?: string,
  ) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Generate a quiz with ${numQuestions} questions about ${subject} with a difficulty of ${difficulty}.
      ${topic ? `The topic is ${topic}.` : ''}
      The response should be a JSON object with the following structure:
      {
        "title": "Quiz Title",
        "type": "${subject}",
        "questions": [
          {
            "questionText": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswerIndex": 0,
            "explanation": "Explanation of the correct answer",
            "type": "multiple-choice"
          }
        ]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error('Failed to generate quiz');
    }
  }
}
