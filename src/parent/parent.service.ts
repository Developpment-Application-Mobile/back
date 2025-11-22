import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Parent } from './schemas/parent.schema';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class ParentService {
  constructor(@InjectModel(Parent.name) private readonly parentModel: Model<Parent>) { }

  // ─────────────────────────────
  // 👨‍👩‍👧 PARENT METHODS
  // ─────────────────────────────

  async createParent(data: any) {
    const parent = new this.parentModel({
      ...data,
      children: [],
      totalScore: 0,
      isActive: true,
    });
    return parent.save();
  }

  async getAllParents() {
    return this.parentModel.find().exec();
  }

  async getParentById(id: string) {
    const parent = await this.parentModel.findById(id);
    if (!parent) throw new NotFoundException('Parent not found');
    return parent;
  }

  async updateParent(id: string, updateData: any) {
    const updates: any = {};

    if (
      updateData.name !== undefined &&
      updateData.name !== null &&
      updateData.name !== ''
    ) {
      updates.name = updateData.name;
    }

    if (
      updateData.email !== undefined &&
      updateData.email !== null &&
      updateData.email !== ''
    ) {
      updates.email = updateData.email;
    }

    if (
      updateData.password !== undefined &&
      updateData.password !== null &&
      updateData.password !== ''
    ) {
      const hashed = await bcrypt.hash(updateData.password, 10);
      updates.password = hashed;
    }

    if (!Object.keys(updates).length) {
      const existing = await this.parentModel.findById(id);
      if (!existing) throw new NotFoundException('Parent not found');
      return existing;
    }

    const parent = await this.parentModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!parent) throw new NotFoundException('Parent not found');
    return parent;
  }

  async deleteParent(id: string) {
    const deleted = await this.parentModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Parent not found');
    return deleted;
  }

  // ─────────────────────────────
  // 👶 CHILD METHODS
  // ─────────────────────────────

  async addKid(parentId: string, kidData: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    // Create a comprehensive "Getting Started" quiz with 30 questions across different topics
    const gettingStartedQuiz = {
      title: 'Getting Started Quiz',
      type: 'mixed',
      
      isAnswered: false,
      score: 0,
      questions: [
        // Math Questions (10)
        { questionText: 'What is 5 + 3?', options: ['6', '7', '8', '9'], correctAnswerIndex: 2, explanation: '5 + 3 = 8', type: 'math', level: kidData.level || 'beginner' },
        { questionText: 'What is 10 - 4?', options: ['5', '6', '7', '8'], correctAnswerIndex: 1, explanation: '10 - 4 = 6', type: 'math', level: kidData.level || 'beginner' },
        { questionText: 'What is 2 × 3?', options: ['4', '5', '6', '7'], correctAnswerIndex: 2, explanation: '2 × 3 = 6', type: 'math', level: kidData.level || 'beginner' },
        { questionText: 'What is 12 ÷ 3?', options: ['2', '3', '4', '5'], correctAnswerIndex: 2, explanation: '12 ÷ 3 = 4', type: 'math', level: kidData.level || 'beginner' },
        { questionText: 'How many sides does a triangle have?', options: ['2', '3', '4', '5'], correctAnswerIndex: 1, explanation: 'A triangle has 3 sides', type: 'math', level: kidData.level || 'beginner' },
        { questionText: 'What is half of 10?', options: ['3', '4', '5', '6'], correctAnswerIndex: 2, explanation: 'Half of 10 is 5', type: 'math', level: kidData.level || 'beginner' },
        { questionText: 'Which number comes after 19?', options: ['18', '20', '21', '22'], correctAnswerIndex: 1, explanation: '20 comes after 19', type: 'math', level: kidData.level || 'beginner' },
        { questionText: 'What is 7 + 7?', options: ['12', '13', '14', '15'], correctAnswerIndex: 2, explanation: '7 + 7 = 14', type: 'math', level: kidData.level || 'beginner' },
        { questionText: 'How many corners does a square have?', options: ['3', '4', '5', '6'], correctAnswerIndex: 1, explanation: 'A square has 4 corners', type: 'math', level: kidData.level || 'beginner' },
        { questionText: 'What is 15 - 8?', options: ['5', '6', '7', '8'], correctAnswerIndex: 2, explanation: '15 - 8 = 7', type: 'math', level: kidData.level || 'beginner' },

        // Science Questions (10)
        { questionText: 'What color is the sky on a clear day?', options: ['Green', 'Blue', 'Red', 'Yellow'], correctAnswerIndex: 1, explanation: 'The sky appears blue on a clear day', type: 'science', level: kidData.level || 'beginner' },
        { questionText: 'How many legs does a spider have?', options: ['6', '8', '10', '12'], correctAnswerIndex: 1, explanation: 'Spiders have 8 legs', type: 'science', level: kidData.level || 'beginner' },
        { questionText: 'What do plants need to grow?', options: ['Candy', 'Toys', 'Water & Sunlight', 'Books'], correctAnswerIndex: 2, explanation: 'Plants need water and sunlight to grow', type: 'science', level: kidData.level || 'beginner' },
        { questionText: 'What is the closest star to Earth?', options: ['Moon', 'Mars', 'Sun', 'Venus'], correctAnswerIndex: 2, explanation: 'The Sun is the closest star to Earth', type: 'science', level: kidData.level || 'beginner' },
        { questionText: 'What do bees make?', options: ['Milk', 'Honey', 'Butter', 'Cheese'], correctAnswerIndex: 1, explanation: 'Bees make honey', type: 'science', level: kidData.level || 'beginner' },
        { questionText: 'How many wings does a bird have?', options: ['1', '2', '3', '4'], correctAnswerIndex: 1, explanation: 'Birds have 2 wings', type: 'science', level: kidData.level || 'beginner' },
        { questionText: 'What season comes after winter?', options: ['Summer', 'Fall', 'Spring', 'Autumn'], correctAnswerIndex: 2, explanation: 'Spring comes after winter', type: 'science', level: kidData.level || 'beginner' },
        { questionText: 'What do fish use to breathe underwater?', options: ['Lungs', 'Gills', 'Nose', 'Mouth'], correctAnswerIndex: 1, explanation: 'Fish breathe underwater using gills', type: 'science', level: kidData.level || 'beginner' },
        { questionText: 'What is water made of?', options: ['Air', 'Hydrogen & Oxygen', 'Sugar', 'Salt'], correctAnswerIndex: 1, explanation: 'Water is made of hydrogen and oxygen (H2O)', type: 'science', level: kidData.level || 'beginner' },
        { questionText: 'Which planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Jupiter', 'Venus'], correctAnswerIndex: 1, explanation: 'Mars is known as the Red Planet', type: 'science', level: kidData.level || 'beginner' },

        // General Knowledge Questions (10)
        { questionText: 'How many days are in a week?', options: ['5', '6', '7', '8'], correctAnswerIndex: 2, explanation: 'A week has 7 days', type: 'general', level: kidData.level || 'beginner' },
        { questionText: 'How many months are in a year?', options: ['10', '11', '12', '13'], correctAnswerIndex: 2, explanation: 'A year has 12 months', type: 'general', level: kidData.level || 'beginner' },
        { questionText: 'What is the first day of the week?', options: ['Monday', 'Sunday', 'Saturday', 'Friday'], correctAnswerIndex: 1, explanation: 'Sunday is the first day of the week', type: 'general', level: kidData.level || 'beginner' },
        { questionText: 'What color is a banana?', options: ['Red', 'Blue', 'Yellow', 'Green'], correctAnswerIndex: 2, explanation: 'A ripe banana is yellow', type: 'general', level: kidData.level || 'beginner' },
        { questionText: 'How many hours are in a day?', options: ['12', '20', '24', '30'], correctAnswerIndex: 2, explanation: 'A day has 24 hours', type: 'general', level: kidData.level || 'beginner' },
        { questionText: 'What animal says "meow"?', options: ['Dog', 'Cat', 'Cow', 'Duck'], correctAnswerIndex: 1, explanation: 'A cat says meow', type: 'general', level: kidData.level || 'beginner' },
        { questionText: 'What do we use to write on paper?', options: ['Fork', 'Spoon', 'Pencil', 'Plate'], correctAnswerIndex: 2, explanation: 'We use a pencil to write on paper', type: 'general', level: kidData.level || 'beginner' },
        { questionText: 'What shape is a ball?', options: ['Square', 'Triangle', 'Circle', 'Rectangle'], correctAnswerIndex: 2, explanation: 'A ball is round/circular', type: 'general', level: kidData.level || 'beginner' },
        { questionText: 'What do we drink when we are thirsty?', options: ['Sand', 'Water', 'Paper', 'Wood'], correctAnswerIndex: 1, explanation: 'We drink water when thirsty', type: 'general', level: kidData.level || 'beginner' },
        { questionText: 'How many eyes do most people have?', options: ['1', '2', '3', '4'], correctAnswerIndex: 1, explanation: 'Most people have 2 eyes', type: 'general', level: kidData.level || 'beginner' },
      ],
    };

    parent.children.push({
      ...kidData,
      quizzes: [gettingStartedQuiz],
      score: 0,
      parentId: parentId,
    });

    return parent.save();
  }

  async updateKid(parentId: string, kidId: string, updateData: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    Object.assign(child, updateData);
    await parent.save();
    return child;
  }

  async deleteKid(parentId: string, kidId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const index = parent.children.findIndex(
      (c: any) => c._id?.toString() === kidId,
    );
    if (index === -1) throw new NotFoundException('Child not found');

    parent.children.splice(index, 1);
    await parent.save();

    return { message: 'Child deleted successfully' };
  }

  // ✅ Generate QR code for child (using Mongo _id)
  async generateChildQr(parentId: string, childId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find(
      (c: any) => c._id?.toString() === childId,
    );
    if (!child) throw new NotFoundException('Child not found');

    const childUrl = child._id?.toString();
    const qrData = await QRCode.toDataURL(childUrl);

    return { child: { name: child.name, id: child._id, parentId: parent._id }, qr: qrData };
  }

  // ✅ Get child by MongoDB _id (when QR is scanned)
  async getChildById(childId: string) {
    const parent = await this.parentModel.findOne({ 'children._id': childId });
    if (!parent) throw new NotFoundException('Parent not found for this child');

    const child = parent.children.find(
      (c: any) => c._id?.toString() === childId,
    );
    if (!child) throw new NotFoundException('Child not found');

    if (!child.parentId) {
      child.parentId = parent._id.toString();
    }
    return { ...child.toObject?.() ?? child, parentId: parent._id.toString() };
  }

  // ─────────────────────────────
  // 🧩 QUIZ METHODS
  // ─────────────────────────────

  private async generateContentWithRetry(
    model: any,
    prompt: string,
    maxRetries = 3,
  ) {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text;
      } catch (error: any) {
        const status = error?.status ?? error?.statusCode;
        if (status !== 503) {
          throw error;
        }
        const wait = (2 ** attempt) * 500;
        await new Promise((resolve) => setTimeout(resolve, wait));
        attempt++;
        if (attempt > maxRetries) {
          throw new ServiceUnavailableException(
            'Gemini API is overloaded. Retry shortly.',
          );
        }
      }
    }
  }

  async addQuiz(parentId: string, kidId: string, quizData: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new NotFoundException('Missing GOOGLE_API_KEY');
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
    });

    // Check if this is retry mode (empty body or missing required fields)
    const isRetryMode = !quizData?.subject || !quizData?.difficulty || !quizData?.nbrQuestions;

    let prompt: string;
    let title: string;
    let fallbackType: string;
    let fallbackLevel: string;

    if (isRetryMode) {
      // Retry mode: generate quiz based on incorrectly answered questions
      const incorrectQuestions = this.getIncorrectlyAnsweredQuestions(child);

      if (incorrectQuestions.length === 0) {
        throw new NotFoundException('No incorrectly answered questions found. Please complete some quizzes first or provide quiz parameters.');
      }

      // Analyze topics and difficulty levels from incorrect questions
      const topics = incorrectQuestions.map(q => q.type);
      const levels = incorrectQuestions.map(q => q.level);
      const mostCommonTopic = this.getMostCommon(topics);
      const mostCommonLevel = this.getMostCommon(levels);

      fallbackType = mostCommonTopic;
      fallbackLevel = mostCommonLevel;
      title = `Retry Quiz - ${mostCommonTopic}`;

      const questionList = incorrectQuestions
        .slice(0, 5)
        .map((q, i) => `${i + 1}. ${q.questionText} (Type: ${q.type}, Level: ${q.level})`)
        .join('\n');

      prompt =
        `Generate a JSON object for a retry quiz to help a student improve. Use this structure:\n` +
        `{"title":"string","type":"string","isAnswered":false,"score":0,"questions":[{"questionText":"string","options":["string","string","string","string"],"correctAnswerIndex":0,"explanation":"string","imageUrl":"string","type":"string","level":"string"}]}\n` +
        `\nThe student struggled with these questions:\n${questionList}\n` +
        `\nRequirements:\n` +
        `- Generate ${Math.min(incorrectQuestions.length, 10)} new questions similar to the ones above\n` +
        `- Focus on subject: ${mostCommonTopic}\n` +
        `- Use difficulty level: ${mostCommonLevel}\n` +
        `- Questions should help reinforce missed concepts\n` +
        `- Ensure strict JSON output, no markdown, no extra text.`;
    } else {
      // Normal mode: generate quiz based on provided parameters
      const subject = quizData.subject;
      const difficulty = quizData.difficulty;
      const nbrQuestions = quizData.nbrQuestions;
      const topic = quizData.topic;

      fallbackType = subject;
      fallbackLevel = difficulty;

      const topicSuffix = topic ? ` - ${topic}` : '';
      title = `${subject}${topicSuffix} Quiz`;

      prompt =
        `Generate a JSON object for a quiz with the following structure:\n` +
        `{"title":"string","type":"string","isAnswered":false,"score":0,"questions":[{"questionText":"string","options":["string","string","string","string"],"correctAnswerIndex":0,"explanation":"string","imageUrl":"string","type":"string","level":"string"}]}` +
        `\nRequirements:\n- subject: ${subject}\n- difficulty: ${difficulty}\n- number_of_questions: ${nbrQuestions}\n- topic: ${topic || 'none'}\n- Ensure strict JSON output, no markdown, no extra text.`;
    }

    const text = await this.generateContentWithRetry(model, prompt, 3);
    console.log('Gemini API response:', text);
    let parsedText = text?.trim() ?? '';
    if (parsedText.startsWith('```')) {
      parsedText = parsedText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();
    }
    let generated;
    try {
      generated = JSON.parse(parsedText);
    } catch {
      const start = parsedText.indexOf('{');
      const end = parsedText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = parsedText.slice(start, end + 1);
        try {
          generated = JSON.parse(candidate);
        } catch {
          throw new NotFoundException(
            'Failed to parse quiz generation response',
          );
        }
      } else {
        throw new NotFoundException('Failed to parse quiz generation response');
      }
    }

    const quiz = {
      title: generated.title || title,
      type: generated.type || fallbackType,
      
      isAnswered: false,
      score: generated.score ?? 0,
      questions: Array.isArray(generated.questions)
        ? generated.questions.map((q: any) => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation,
          imageUrl: q.imageUrl,
          type: q.type || fallbackType,
          level: q.level || fallbackLevel,
        }))
        : [],
    };

    child.quizzes.push(quiz);
    await parent.save();
    return child.quizzes.at(-1);
  }

  async getAllQuizzes(parentId: string, kidId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');
    return child.quizzes;
  }

  async getQuizById(parentId: string, kidId: string, quizId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async updateQuiz(
    parentId: string,
    kidId: string,
    quizId: string,
    updateData: any,
  ) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    Object.assign(quiz, updateData);
    await parent.save();
    return quiz;
  }

  async submitQuizAnswers(
    parentId: string,
    kidId: string,
    quizId: string,
    answers: number[],
  ) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    if (answers.length !== quiz.questions.length) {
      throw new NotFoundException(
        `Expected ${quiz.questions.length} answers but received ${answers.length}`,
      );
    }

    // Update each question with user's answer
    let correctCount = 0;
    for (let index = 0; index < quiz.questions.length; index++) {
      const question = quiz.questions[index];
      question.userAnswerIndex = answers[index];
      if (answers[index] === question.correctAnswerIndex) {
        correctCount++;
      }
    }

    // Calculate score as percentage
    const score = Math.round((correctCount / quiz.questions.length) * 100);

    // Update quiz properties
    quiz.isAnswered = true;
  
    quiz.score = score;

    // Update child's total score
    child.Score = (child.Score || 0) + score;

    parent.markModified('children');
    await parent.save();

    return {
      quiz,
      correctAnswers: correctCount,
      totalQuestions: quiz.questions.length,
      score,
    };
  }

  async deleteQuiz(parentId: string, kidId: string, quizId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const index = child.quizzes.findIndex(
      (q: any) => q._id?.toString() === quizId,
    );
    if (index === -1) throw new NotFoundException('Quiz not found');

    child.quizzes.splice(index, 1);
    await parent.save();
    return { message: 'Quiz deleted successfully' };
  }

  // ─────────────────────────────
  // ❓ QUESTION METHODS
  // ─────────────────────────────

  async addQuestion(
    parentId: string,
    kidId: string,
    quizId: string,
    questionData: any,
  ) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');
    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    quiz.questions.push(questionData.question ?? questionData);
    await parent.save();
    return quiz.questions.at(-1);
  }

  async updateQuestion(
    parentId: string,
    kidId: string,
    quizId: string,
    questionId: string,
    updateData: any,
  ) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    const question = quiz.questions.find(
      (q: any) => q._id?.toString() === questionId,
    );
    if (!question) throw new NotFoundException('Question not found');

    Object.assign(question, updateData);
    parent.markModified('children');
    await parent.save();

    return question;
  }

  async deleteQuestion(
    parentId: string,
    kidId: string,
    quizId: string,
    questionId: string,
  ) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const quiz = child.quizzes.find((q: any) => q._id?.toString() === quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    const questionIndex = quiz.questions.findIndex(
      (q: any) => q._id?.toString() === questionId,
    );
    if (questionIndex === -1) throw new NotFoundException('Question not found');

    quiz.questions.splice(questionIndex, 1);
    await parent.save();

    return { message: 'Question deleted successfully' };
  }

  // ─────────────────────────────
  // 🔍 FIND BY EMAIL
  // ─────────────────────────────
  async findByEmail(email: string) {
    return this.parentModel.findOne({ email }).exec();
  }

  // ─────────────────────────────
  // 🔄 HELPER METHODS FOR RETRY MODE
  // ─────────────────────────────
  private getIncorrectlyAnsweredQuestions(child: any): any[] {
    const incorrectQuestions: any[] = [];

    for (const quiz of child.quizzes || []) {
      for (const question of quiz.questions || []) {
        // Question is incorrect if userAnswerIndex exists and doesn't match correctAnswerIndex
        if (
          question.userAnswerIndex !== undefined &&
          question.userAnswerIndex !== null &&
          question.userAnswerIndex !== question.correctAnswerIndex
        ) {
          incorrectQuestions.push(question);
        }
      }
    }

    return incorrectQuestions;
  }

  private getMostCommon(items: string[]): string {
    if (items.length === 0) return 'general';

    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let maxCount = 0;
    let mostCommon = items[0];

    for (const [item, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }

    return mostCommon;
  }
}
