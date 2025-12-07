import { Injectable, NotFoundException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Parent, ParentDocument } from './schemas/parent.schema';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Quest, QuestStatus, QuestType } from './schemas/subschemas/quest.schema';
import PDFDocument from 'pdfkit';

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
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
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
        `{"title":"string","type":"string","isAnswered":false,"score":0,"questions":[{"questionText":"string","options":["string","string","string","string"],"correctAnswerIndex":0,"explanation":"string","imageKeyword":"string","type":"string","level":"string"}]}\n` +
        `\nThe student struggled with these questions:\n${questionList}\n` +
        `\nRequirements:\n` +
        `- Generate ${Math.min(incorrectQuestions.length, 10)} new questions similar to the ones above\n` +
        `- Focus on subject: ${mostCommonTopic}\n` +
        `- Use difficulty level: ${mostCommonLevel}\n` +
        `- Questions should help reinforce missed concepts\n` +
        `- IMPORTANT: For questions about concrete objects (animals, fruit, vehicles, colors, shapes), you MUST provide a simple English 'imageKeyword' (e.g., "cat", "apple", "red car").\n` +
        `- If the question is abstract (math, logic) and no image is suitable, leave "imageKeyword" empty.\n` +
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
        `{"title":"string","type":"string","isAnswered":false,"score":0,"questions":[{"questionText":"string","options":["string","string","string","string"],"correctAnswerIndex":0,"explanation":"string","imageKeyword":"string","type":"string","level":"string"}]}` +
        `\nRequirements:\n- subject: ${subject}\n- difficulty: ${difficulty}\n- number_of_questions: ${nbrQuestions}\n- topic: ${topic || 'none'}\n` +
        `- IMPORTANT: For questions about concrete objects (animals, fruit, vehicles, colors, shapes), you MUST provide a simple English 'imageKeyword' (e.g., "cat", "apple", "red car").\n` +
        `- If the question is abstract (math, logic) and no image is suitable, leave "imageKeyword" empty.\n` +
        `- Ensure strict JSON output, no markdown, no extra text.`;
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
        ? generated.questions.map((q: any) => {
          let imageUrl = q.imageUrl;
          if (!imageUrl && q.imageKeyword) {
            // Convert keyword to a placeholder image URL
            imageUrl = `https://loremflickr.com/400/300/${encodeURIComponent(q.imageKeyword)}`;
          }

          return {
            questionText: q.questionText,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            explanation: q.explanation,
            imageUrl: imageUrl,
            type: q.type || fallbackType,
            level: q.level || fallbackLevel,
          }
        })
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

    // ===== CHECK ANSWERS =====
    let correctCount = 0;

    for (let i = 0; i < quiz.questions.length; i++) {
      const question: any = quiz.questions[i];
      const userAns = answers[i];

      question.userAnswerIndex = userAns;

      if (userAns === question.correctAnswerIndex) {
        correctCount++;
      }
    }

    parent.markModified('children');

    // ===== SCORE CALCULATION =====
    const score = Math.round((correctCount / quiz.questions.length) * 100);

    quiz.isAnswered = true;
    quiz.score = score;

    // ===== UPDATE CHILD SCORE PROPERTIES =====
    child.Score = (child.Score || 0) + score;
    child.lifetimeScore = (child.lifetimeScore || 0) + score;

    // Use non-linear progression level
    child.progressionLevel = this.calculateLevel(child.lifetimeScore);

    // ===== QUEST SYSTEM: TRIGGER QUEST LOGIC =====
    const isPerfectScore = score === 100;

    await this.trackQuestProgress(
      parentId,
      kidId,
      QuestType.COMPLETE_QUIZZES,
      1,           // increment by 1 quiz
      score,       // points earned
      isPerfectScore,
      parent       // <--- Pass existing parent instance
    );

    await parent.save();

    // ===== RESPONSE =====
    return {
      quiz: {
        ...quiz,
        questions: quiz.questions.map((q: any) => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          userAnswerIndex: q.userAnswerIndex,
          explanation: q.explanation,
          imageUrl: q.imageUrl,
          type: q.type,
          level: q.level,
        })),
      },
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

  // ─────────────────────────────
  // 🎁 GIFT & REWARDS METHODS
  // ─────────────────────────────

  async createGift(parentId: string, kidId: string, giftData: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const newGift = {
      _id: new Types.ObjectId().toString(),
      title: giftData.title,
      cost: giftData.cost,
    };

    if (!child.shopCatalog) {
      child.shopCatalog = [];
    }

    child.shopCatalog.push(newGift);
    await parent.save();
    return newGift;
  }

  async getGifts(parentId: string, kidId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    return child.shopCatalog || [];
  }

  async deleteGift(parentId: string, kidId: string, giftId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    if (!child.shopCatalog) return { message: 'Gift not found' };

    const initialLength = child.shopCatalog.length;
    child.shopCatalog = child.shopCatalog.filter(
      (g: any) => g._id?.toString() !== giftId
    );

    if (child.shopCatalog.length === initialLength) {
      throw new NotFoundException('Gift not found');
    }

    await parent.save();
    return { message: 'Gift deleted successfully' };
  }

  async buyGift(parentId: string, kidId: string, giftId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    const gift = child.shopCatalog?.find((g: any) => g._id?.toString() === giftId);
    if (!gift) throw new NotFoundException('Gift not found in catalog');

    // Check if gift has already been purchased
    if (!child.inventory) {
      child.inventory = [];
    }

    const alreadyPurchased = child.inventory.some(
      (item: any) => item.title === gift.title
    );

    if (alreadyPurchased) {
      throw new BadRequestException('You have already purchased this gift');
    }

    if (child.Score < gift.cost) {
      throw new BadRequestException('Not enough points to buy this gift');
    }

    // Deduct points
    child.Score -= gift.cost;

    // Add to inventory
    child.inventory.push({
      title: gift.title,
      cost: gift.cost,
      purchasedAt: new Date(),
    });

    await parent.save();
    return {
      message: 'Gift purchased successfully',
      remainingScore: child.Score,
      gift: gift
    };
  }


  // ----- Generate initial quests (used when child has no quests) -----
  private generateInitialQuests(): Quest[] {
    return [
      {
        type: QuestType.COMPLETE_QUIZZES,
        title: 'Complete 5 Quizzes',
        description: 'Complete 5 quizzes',
        target: 5,
        progress: 0,
        reward: 100,
        status: QuestStatus.ACTIVE,
        progressionLevel: 1,
      } as any,
      {
        type: QuestType.EARN_POINTS,
        title: 'Earn 200 Points',
        description: 'Earn 200 points',
        target: 200,
        progress: 0,
        reward: 150,
        status: QuestStatus.ACTIVE,
        progressionLevel: 1,
      } as any,
      {
        type: QuestType.PERFECT_SCORE,
        title: 'Get a Perfect Score',
        description: 'Get a perfect score on a quiz',
        target: 1,
        progress: 0,
        reward: 200,
        status: QuestStatus.ACTIVE,
        progressionLevel: 1,
      } as any,
    ];
  }

  // ----- Generate next quest in progression for a given type -----
  private generateNextQuest(questType: QuestType, currentLevel: number): Quest {
    const progressionMap = {
      [QuestType.COMPLETE_QUIZZES]: {
        targets: [5, 10, 15, 20],
        rewards: [100, 200, 300, 400],
      },
      [QuestType.COMPLETE_GAMES]: {
        targets: [3, 5, 10, 15],
        rewards: [150, 250, 350, 450],
      },
      [QuestType.EARN_POINTS]: {
        targets: [200, 500, 1000, 1500],
        rewards: [150, 300, 500, 700],
      },
      [QuestType.PERFECT_SCORE]: {
        targets: [1, 3, 5, 10],
        rewards: [200, 400, 600, 800],
      },
    } as any;

    const progression = progressionMap[questType];
    const nextLevel = (currentLevel || 1) + 1;
    const idx = Math.min(nextLevel - 1, progression.targets.length - 1);

    return {
      type: questType,
      title: (() => {
        switch (questType) {
          case QuestType.COMPLETE_QUIZZES:
            return `Complete ${progression.targets[idx]} Quizzes`;
          case QuestType.COMPLETE_GAMES:
            return `Complete ${progression.targets[idx]} Games`;
          case QuestType.EARN_POINTS:
            return `Earn ${progression.targets[idx]} Points`;
          case QuestType.PERFECT_SCORE:
            return `Get ${progression.targets[idx]} Perfect Score${progression.targets[idx] > 1 ? 's' : ''}`;
        }
      })(),
      description: '',
      target: progression.targets[idx],
      progress: 0,
      reward: progression.rewards[idx],
      status: QuestStatus.ACTIVE,
      progressionLevel: nextLevel,
    } as any;
  }

  // ----- Get quests for a child (ensures initial generation) -----
  async getQuests(parentId: string, kidId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    if (!child.quests || !Array.isArray(child.quests) || child.quests.length === 0) {
      child.quests = this.generateInitialQuests();
      parent.markModified('children');
      await parent.save();
    }

    return child.quests;
  }

  // ----- Track quest progress (call when quiz/game submitted) -----
  async trackQuestProgress(
    parentId: string,
    kidId: string,
    questType: QuestType,
    progressIncrement = 1,
    pointsEarned = 0,
    isPerfectScore = false,
    existingParent?: ParentDocument // <--- Optional existing parent
  ) {
    // Use existing parent if provided, otherwise fetch
    const parent = existingParent || await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    if (!child.quests || !Array.isArray(child.quests)) {
      child.quests = this.generateInitialQuests();
    }

    let questsUpdated = false;

    for (const quest of child.quests) {
      if (quest.status !== QuestStatus.ACTIVE) continue;
      if (typeof quest.progress !== 'number') quest.progress = 0;

      let shouldUpdate = false;

      switch (quest.type) {
        case QuestType.COMPLETE_QUIZZES:
          if (questType === QuestType.COMPLETE_QUIZZES) {
            quest.progress += progressIncrement;
            shouldUpdate = true;
          }
          break;
        case QuestType.COMPLETE_GAMES:
          if (questType === QuestType.COMPLETE_GAMES) {
            quest.progress += progressIncrement;
            shouldUpdate = true;
          }
          break;
        case QuestType.EARN_POINTS:
          if (pointsEarned > 0) {
            quest.progress += pointsEarned;
            shouldUpdate = true;
          }
          break;
        case QuestType.PERFECT_SCORE:
          if (isPerfectScore) {
            quest.progress += 1;
            shouldUpdate = true;
          }
          break;
      }

      if (shouldUpdate) {
        questsUpdated = true;
        if (quest.progress >= quest.target) {
          quest.status = QuestStatus.COMPLETED;
        }
      }
    }

    if (questsUpdated) {
      // If we are using an existing parent instance from another method (like submitQuiz),
      // do NOT save here. The caller will save.
      if (existingParent) {
        // Just Mark modified if needed, but Mongoose usually tracks changes to subdocs automatically
        // when fetched document is modified. Explicitly marking just in case.
        parent.markModified('children');
        return child.quests;
      }

      // If we fetched the parent ourselves, we MUST save.
      parent.markModified('children');
      const updatedParent = await parent.save();
      const updatedChild = updatedParent.children.find((c: any) => c._id?.toString() === kidId);
      return updatedChild!.quests;
    }

    return null;
  }

  // ----- Claim quest reward -----
  async claimQuestReward(parentId: string, kidId: string, questId: string) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    if (!child.quests || !Array.isArray(child.quests)) child.quests = this.generateInitialQuests();

    const quest = child.quests.find((q: any) => q._id?.toString() === questId);
    if (!quest) throw new NotFoundException('Quest not found');

    if (quest.status === QuestStatus.CLAIMED) throw new BadRequestException('Quest reward already claimed');
    if (quest.status !== QuestStatus.COMPLETED) throw new BadRequestException('Quest not completed yet');

    // Award points
    const pointsAwarded = quest.reward;
    child.Score = (child.Score || 0) + pointsAwarded;
    child.lifetimeScore = (child.lifetimeScore || 0) + pointsAwarded;

    // Update level based on new score
    child.progressionLevel = this.calculateLevel(child.lifetimeScore);

    quest.status = QuestStatus.CLAIMED;

    // Generate next quest in progression and push
    const nextQuest = this.generateNextQuest(quest.type, quest.progressionLevel || 1);
    child.quests.push(nextQuest);

    parent.markModified('children');
    await parent.save();

    // Return useful response (child-level info)
    // Return full child object to update frontend state correctly
    const childObj = child.toObject ? child.toObject() : child;
    return {
      ...childObj,
      parentId: parent._id.toString(),
    };
  }

  // Helper: Calculate level based on score (non-linear)
  // Level = floor(sqrt(score / 100)) + 1
  // 0 -> L1
  // 100 -> L2
  // 400 -> L3
  // 900 -> L4
  private calculateLevel(score: number): number {
    return Math.floor(Math.sqrt(Math.max(0, score) / 100)) + 1;
  }

  
  // ─────────────────────────────
  // 📊 AI REVIEW METHODS
  // ─────────────────────────────

  async generateChildReview(parentId: string, kidId: string, options?: any) {
    const parent = await this.parentModel.findById(parentId);
    if (!parent) throw new NotFoundException('Parent not found');

    const child = parent.children.find((c: any) => c._id?.toString() === kidId);
    if (!child) throw new NotFoundException('Child not found');

    // Automatically filter to last 30 days (last month)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all quizzes from the last 30 days
    let quizzes = (child.quizzes || []).filter((quiz: any) => {
      // If quiz has createdAt, check if it's within last 30 days
      if (quiz.createdAt) {
        const quizDate = new Date(quiz.createdAt);
        return quizDate >= thirtyDaysAgo;
      }
      // If no createdAt, include it (assume it's recent)
      return true;
    });

    // Calculate statistics - filter for answered quizzes
    const answeredQuizzes = quizzes.filter((q: any) => q.isAnswered === true);
    const totalQuizzes = answeredQuizzes.length;

    if (totalQuizzes === 0) {
      // Provide more helpful error message
      const totalAllQuizzes = (child.quizzes || []).length;
      const totalAnsweredAll = (child.quizzes || []).filter((q: any) => q.isAnswered === true).length;

      if (totalAllQuizzes === 0) {
        throw new NotFoundException('This child has no quizzes yet. Please create and complete some quizzes first.');
      } else if (totalAnsweredAll === 0) {
        throw new NotFoundException(`This child has ${totalAllQuizzes} quiz(es) but none have been completed yet. Please submit answers to at least one quiz.`);
      } else {
        throw new NotFoundException(`No completed quizzes found in the last 30 days. The child has ${totalAnsweredAll} completed quiz(es) total, but they are older than 30 days.`);
      }
    }

    // Calculate overall average
    const totalScore = answeredQuizzes.reduce((sum: number, q: any) => sum + (q.score || 0), 0);
    const overallAverage = totalScore / totalQuizzes;

    // Group by topic and calculate performance
    const topicStats: Record<string, any> = {};
    answeredQuizzes.forEach((quiz: any) => {
      const topic = quiz.type || 'general';
      if (!topicStats[topic]) {
        topicStats[topic] = {
          topic,
          scores: [],
          quizzesCompleted: 0,
        };
      }
      topicStats[topic].scores.push(quiz.score || 0);
      topicStats[topic].quizzesCompleted++;
    });

    const performanceByTopic = Object.values(topicStats).map((stat: any) => ({
      topic: stat.topic,
      quizzesCompleted: stat.quizzesCompleted,
      averageScore: stat.scores.reduce((a: number, b: number) => a + b, 0) / stat.scores.length,
      highestScore: Math.max(...stat.scores),
      lowestScore: Math.min(...stat.scores),
    }));

    // Sort topics by average score to identify strengths and weaknesses
    const sortedTopics = [...performanceByTopic].sort((a, b) => b.averageScore - a.averageScore);
    const strongTopics = sortedTopics.slice(0, Math.ceil(sortedTopics.length / 2));
    const weakTopics = sortedTopics.slice(Math.ceil(sortedTopics.length / 2));

    // Prepare data for AI analysis
    const performanceSummary = performanceByTopic
      .map(p => `${p.topic}: ${p.quizzesCompleted} quizzes, average ${p.averageScore.toFixed(1)}%, range ${p.lowestScore}-${p.highestScore}%`)
      .join('\n');

    const strongTopicsList = strongTopics.map(t => `${t.topic} (${t.averageScore.toFixed(1)}%)`).join(', ');
    const weakTopicsList = weakTopics.map(t => `${t.topic} (${t.averageScore.toFixed(1)}%)`).join(', ');

    // Generate AI review using Gemini
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new NotFoundException('Missing GOOGLE_API_KEY');
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `You are an educational expert analyzing a child's overall quiz performance across ALL subjects. Generate a comprehensive review for parents that covers the child's complete learning profile.

Child Information:
- Name: ${child.name}
- Age: ${child.age}
- Level: ${child.level}
- Progression Level: ${child.progressionLevel || 1}
- Total Quizzes Completed: ${totalQuizzes}
- Overall Average Score: ${overallAverage.toFixed(1)}%
- Lifetime Score: ${child.lifetimeScore || 0}

Performance by Topic:
${performanceSummary}

Strong Topics: ${strongTopicsList || 'None yet'}
Weak Topics: ${weakTopicsList || 'None yet'}

Generate a JSON response with this structure:
{
  "strengths": "string - Comprehensive analysis of what the child excels at ACROSS ALL TOPICS. Mention specific subjects and patterns. (3-4 sentences)",
  "weaknesses": "string - Comprehensive analysis of areas needing improvement ACROSS ALL TOPICS. Mention specific subjects and learning gaps. (3-4 sentences)",
  "recommendations": "string - Specific actionable recommendations for parents covering ALL subjects. Include strategies for both strong and weak areas. Format as bullet points. (4-5 recommendations)",
  "summary": "string - Overall encouraging summary of the child's COMPLETE learning journey across all subjects. Highlight overall progress and potential. (3-4 sentences)"
}

IMPORTANT Requirements:
- Analyze the child's performance HOLISTICALLY across all subjects (math, science, general knowledge, etc.)
- Compare performance between different topics
- Identify cross-subject patterns (e.g., "strong analytical skills across math and science")
- Provide balanced feedback covering all areas of learning
- Be encouraging and positive while being honest
- Provide specific, actionable advice that addresses the complete learning profile
- Reference actual performance data from multiple topics
- Keep language appropriate for parents
- Focus on growth mindset and well-rounded development`;

    const text = await this.generateContentWithRetry(model, prompt, 3);
    let parsedText = text?.trim() ?? '';
    if (parsedText.startsWith('```')) {
      parsedText = parsedText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();
    }

    let aiReview;
    try {
      aiReview = JSON.parse(parsedText);
    } catch {
      const start = parsedText.indexOf('{');
      const end = parsedText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = parsedText.slice(start, end + 1);
        try {
          aiReview = JSON.parse(candidate);
        } catch {
          throw new NotFoundException('Failed to parse AI review response');
        }
      } else {
        throw new NotFoundException('Failed to parse AI review response');
      }
    }

    // Construct response data
    const reviewData = {
      childName: child.name,
      childAge: child.age,
      childLevel: child.level,
      progressionLevel: child.progressionLevel || 1,
      totalQuizzes,
      overallAverage: parseFloat(overallAverage.toFixed(2)),
      lifetimeScore: child.lifetimeScore || 0,
      currentScore: child.Score || 0,
      performanceByTopic,
      strengths: aiReview.strengths || 'No strengths analysis available',
      weaknesses: aiReview.weaknesses || 'No weaknesses analysis available',
      recommendations: aiReview.recommendations || 'No recommendations available',
      summary: aiReview.summary || 'No summary available',
      generatedAt: new Date(),
    };

    // Generate PDF and convert to base64
    const pdfBuffer = await this.generatePdfFromReviewData(reviewData);
    const pdfBase64 = pdfBuffer.toString('base64');

    return {
      ...reviewData,
      pdfBase64,
    };
  }

  private async generatePdfFromReviewData(reviewData: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Child Performance Review', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Child Information Section
      doc.fontSize(16).font('Helvetica-Bold').text('Child Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text(`Name: ${reviewData.childName}`);
      doc.text(`Age: ${reviewData.childAge} years old`);
      doc.text(`Level: ${reviewData.childLevel}`);
      doc.text(`Progression Level: ${reviewData.progressionLevel}`);
      doc.moveDown(1.5);

      // Overall Statistics Section
      doc.fontSize(16).font('Helvetica-Bold').text('Overall Statistics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text(`Total Quizzes Completed: ${reviewData.totalQuizzes}`);
      doc.text(`Overall Average Score: ${reviewData.overallAverage}%`);
      doc.text(`Lifetime Score: ${reviewData.lifetimeScore} points`);
      doc.text(`Current Available Points: ${reviewData.currentScore} points`);
      doc.moveDown(1.5);

      // Performance by Topic Section
      doc.fontSize(16).font('Helvetica-Bold').text('Performance by Topic', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');

      reviewData.performanceByTopic.forEach((topic: any) => {
        doc.font('Helvetica-Bold').text(`${topic.topic.toUpperCase()}:`, { continued: true });
        doc.font('Helvetica').text(` ${topic.quizzesCompleted} quizzes, avg ${topic.averageScore.toFixed(1)}% (${topic.lowestScore}%-${topic.highestScore}%)`);
      });
      doc.moveDown(1.5);

      // AI Analysis Section
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#2E7D32').text('Strengths', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor('black').text(reviewData.strengths, { align: 'justify' });
      doc.moveDown(1.5);

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#D32F2F').text('Areas for Improvement', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor('black').text(reviewData.weaknesses, { align: 'justify' });
      doc.moveDown(1.5);

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1976D2').text('Recommendations', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor('black').text(reviewData.recommendations, { align: 'justify' });
      doc.moveDown(1.5);

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#7B1FA2').text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor('black').text(reviewData.summary, { align: 'justify' });
      doc.moveDown(2);

      // Footer
      doc.fontSize(9).fillColor('gray').text(
        'This report was generated automatically using AI analysis. Please use it as a guide for supporting your child\'s learning journey.',
        { align: 'center' }
      );

      doc.end();
    });
  }

  async exportReviewToPdf(parentId: string, kidId: string, options?: any): Promise<Buffer> {
    // Generate review data (this already includes pdfBase64, but we'll regenerate for consistency)
    const reviewData = await this.generateChildReview(parentId, kidId, options);

    // Remove pdfBase64 from reviewData before passing to PDF generator
    const { pdfBase64, ...dataForPdf } = reviewData;

    // Generate PDF using the helper method
    return this.generatePdfFromReviewData(dataForPdf);
  }

}
