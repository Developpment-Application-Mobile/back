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
 // ===== Add to parent.service.ts =====
// Add these methods to your existing ParentService class

// ─────────────────────────────
// 🧩 PUZZLE METHODS
// ─────────────────────────────

async generatePuzzle(parentId: string, kidId: string, puzzleData: any) {
  const parent = await this.parentModel.findById(parentId);
  if (!parent) throw new NotFoundException('Parent not found');

  const child = parent.children.find((c: any) => c._id?.toString() === kidId);
  if (!child) throw new NotFoundException('Child not found');

  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new NotFoundException('Missing GOOGLE_API_KEY');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  // Determine puzzle parameters based on child's age and level
  const childAge = child.age || 7;
  const childLevel = child.level || 'beginner';
  
  const type = puzzleData?.type || this.getPuzzleTypeForAge(childAge);
  const difficulty = puzzleData?.difficulty || this.getDifficultyForLevel(childLevel);
  const gridSize = puzzleData?.gridSize || this.getGridSizeForDifficulty(difficulty);
  const topic = puzzleData?.topic || this.getRandomTopic(childAge);

  const prompt = this.buildPuzzlePrompt(type, difficulty, gridSize, topic, childAge);
  
  const text = await this.generateContentWithRetry(model, prompt, 3);
  
  let parsedText = text?.trim() ?? '';
  if (parsedText.startsWith('```')) {
    parsedText = parsedText.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  }

  let generated: any;
  try {
    generated = JSON.parse(parsedText);
  } catch {
    const start = parsedText.indexOf('{');
    const end = parsedText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      generated = JSON.parse(parsedText.slice(start, end + 1));
    } else {
      throw new NotFoundException('Failed to parse puzzle generation response');
    }
  }

  // Create shuffled pieces
  const pieces = this.createPuzzlePieces(generated, gridSize, type);

  const puzzle = {
    title: generated.title || `${topic} Puzzle`,
    type: type,
    difficulty: difficulty,
    gridSize: gridSize,
    pieces: pieces,
    hint: generated.hint || '',
    solution: generated.solution || '',
    imageUrl: generated.imageUrl || '',
    isCompleted: false,
    attempts: 0,
    timeSpent: 0,
    score: 0,
    completedAt: null as Date | null,
  };

  // Initialize puzzles array if not exists
  if (!child.puzzles) {
    child.puzzles = [];
  }

  child.puzzles.push(puzzle as any);
  parent.markModified('children');
  await parent.save();

  return child.puzzles.at(-1);
}

private buildPuzzlePrompt(type: string, difficulty: string, gridSize: number, topic: string, age: number): string {
  const totalPieces = gridSize * gridSize;
  
  const basePrompt = `Generate a JSON object for a ${type} puzzle for a ${age}-year-old child.
  
Structure required:
{
  "title": "string",
  "type": "${type}",
  "difficulty": "${difficulty}",
  "hint": "string (helpful hint for the child)",
  "solution": "string (the correct answer or arrangement)",
  "pieces": [array of piece content]
}

Requirements:
- Topic: ${topic}
- Difficulty: ${difficulty}
- Number of pieces: ${totalPieces}
- Age-appropriate content for ${age}-year-old
- Educational and fun
- Clear hint that helps without giving away the answer
`;

  switch (type) {
    case 'word':
      return basePrompt + `
- Create a word scramble puzzle
- "pieces" should be an array of ${totalPieces} letters that form a word
- The word should be related to ${topic}
- "solution" is the correct word
- Example: pieces: ["C", "A", "T"] for the word "CAT"`;

    case 'number':
      return basePrompt + `
- Create a number sequence puzzle
- "pieces" should be an array of ${totalPieces} numbers
- The child needs to arrange them in correct order (ascending, descending, or pattern)
- "solution" describes the pattern
- Difficulty ${difficulty}: use numbers appropriate for age ${age}`;

    case 'sequence':
      return basePrompt + `
- Create a logical sequence puzzle
- "pieces" should be an array of ${totalPieces} items (words or short phrases)
- Items should be arranged in a logical order (e.g., days of week, steps in a process)
- "solution" is the correct sequence description
- Topic: ${topic}`;

    case 'pattern':
      return basePrompt + `
- Create a pattern recognition puzzle
- "pieces" should be an array of ${totalPieces} elements following a pattern
- One piece should be marked as "?" for the child to identify
- "solution" is what should replace "?"
- Use shapes, colors, or numbers appropriate for age ${age}`;

    default:
      return basePrompt + `
- Create an image-based puzzle description
- "pieces" should describe ${totalPieces} parts of an image related to ${topic}
- "imageUrl" should be empty (will be set separately)
- "solution" describes what the complete image shows`;
  }
}

private createPuzzlePieces(generated: any, gridSize: number, _type: string): Array<{
  id: number;
  correctPosition: number;
  currentPosition: number;
  content: string;
  imageUrl: string;
}> {
  const totalPieces = gridSize * gridSize;
  const pieces: Array<{
    id: number;
    correctPosition: number;
    currentPosition: number;
    content: string;
    imageUrl: string;
  }> = [];
  
  const contentArray = generated.pieces || [];
  
  for (let i = 0; i < totalPieces; i++) {
    pieces.push({
      id: i,
      correctPosition: i,
      currentPosition: i,
      content: String(contentArray[i] || `Piece ${i + 1}`),
      imageUrl: '',
    });
  }

  // Shuffle pieces (Fisher-Yates)
  const shuffledPositions = [...Array(totalPieces).keys()];
  for (let i = shuffledPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
  }

  // Assign shuffled positions
  for (let i = 0; i < pieces.length; i++) {
    pieces[i].currentPosition = shuffledPositions[i];
  }

  return pieces;
}

private getPuzzleTypeForAge(age: number): string {
  if (age <= 5) return 'word';
  if (age <= 7) {
    const types = ['word', 'number', 'sequence'];
    return types[Math.floor(Math.random() * types.length)];
  }
  const types = ['word', 'number', 'sequence', 'pattern'];
  return types[Math.floor(Math.random() * types.length)];
}

private getDifficultyForLevel(level: string): string {
  switch (level?.toLowerCase()) {
    case 'advanced': return 'hard';
    case 'intermediate': return 'medium';
    default: return 'easy';
  }
}

private getGridSizeForDifficulty(difficulty: string): number {
  switch (difficulty) {
    case 'hard': return 4;
    case 'medium': return 3;
    default: return 2;
  }
}

private getRandomTopic(age: number): string {
  const youngTopics = ['Animals', 'Colors', 'Fruits', 'Numbers', 'Shapes', 'Family'];
  const olderTopics = ['Science', 'Nature', 'Space', 'History', 'Geography', 'Sports'];
  const topics = age <= 6 ? youngTopics : [...youngTopics, ...olderTopics];
  return topics[Math.floor(Math.random() * topics.length)];
}

async getAllPuzzles(parentId: string, kidId: string) {
  const parent = await this.parentModel.findById(parentId);
  if (!parent) throw new NotFoundException('Parent not found');
  
  const child = parent.children.find((c: any) => c._id?.toString() === kidId);
  if (!child) throw new NotFoundException('Child not found');
  
  return child.puzzles || [];
}

async getPuzzleById(parentId: string, kidId: string, puzzleId: string) {
  const parent = await this.parentModel.findById(parentId);
  if (!parent) throw new NotFoundException('Parent not found');
  
  const child = parent.children.find((c: any) => c._id?.toString() === kidId);
  if (!child) throw new NotFoundException('Child not found');

  const puzzle = (child.puzzles as any[])?.find((p: any) => p._id?.toString() === puzzleId);
  if (!puzzle) throw new NotFoundException('Puzzle not found');
  
  return puzzle;
}

async submitPuzzleSolution(
  parentId: string,
  kidId: string,
  puzzleId: string,
  submission: { positions: number[]; timeSpent?: number }
) {
  const parent = await this.parentModel.findById(parentId);
  if (!parent) throw new NotFoundException('Parent not found');

  const child = parent.children.find((c: any) => c._id?.toString() === kidId);
  if (!child) throw new NotFoundException('Child not found');

  const puzzle = (child.puzzles as any[])?.find((p: any) => p._id?.toString() === puzzleId);
  if (!puzzle) throw new NotFoundException('Puzzle not found');

  puzzle.attempts += 1;
  puzzle.timeSpent += submission.timeSpent || 0;

  // Check if solution is correct
  const isCorrect = this.checkPuzzleSolution(puzzle, submission.positions);

  if (isCorrect) {
    puzzle.isCompleted = true;
    puzzle.completedAt = new Date();
    
    // Calculate score based on attempts and time
    const baseScore = puzzle.difficulty === 'hard' ? 100 : puzzle.difficulty === 'medium' ? 75 : 50;
    const attemptPenalty = Math.max(0, (puzzle.attempts - 1) * 5);
    const timePenalty = Math.min(20, Math.floor(puzzle.timeSpent / 60));
    puzzle.score = Math.max(10, baseScore - attemptPenalty - timePenalty);

    // Update child's total score
    child.Score = (child.Score || 0) + puzzle.score;
  }

  // Update piece positions
  submission.positions.forEach((pos: number, index: number) => {
    if (puzzle.pieces[index]) {
      puzzle.pieces[index].currentPosition = pos;
    }
  });

  parent.markModified('children');
  await parent.save();

  return {
    puzzle,
    isCorrect,
    score: isCorrect ? puzzle.score : 0,
    attempts: puzzle.attempts,
    message: isCorrect ? 'Congratulations! Puzzle completed!' : 'Not quite right. Try again!',
  };
}

private checkPuzzleSolution(puzzle: any, positions: number[]): boolean {
  if (!puzzle.pieces || positions.length !== puzzle.pieces.length) {
    return false;
  }

  return puzzle.pieces.every((piece: any, index: number) => {
    return positions[index] === piece.correctPosition;
  });
}

async deletePuzzle(parentId: string, kidId: string, puzzleId: string) {
  const parent = await this.parentModel.findById(parentId);
  if (!parent) throw new NotFoundException('Parent not found');

  const child = parent.children.find((c: any) => c._id?.toString() === kidId);
  if (!child) throw new NotFoundException('Child not found');

  const puzzles = child.puzzles as any[];
  const index = puzzles?.findIndex((p: any) => p._id?.toString() === puzzleId);
  if (index === -1 || index === undefined) throw new NotFoundException('Puzzle not found');

  puzzles.splice(index, 1);
  parent.markModified('children');
  await parent.save();

  return { message: 'Puzzle deleted successfully' };
}

// Generate adaptive puzzle based on performance
async generateAdaptivePuzzle(parentId: string, kidId: string) {
  const parent = await this.parentModel.findById(parentId);
  if (!parent) throw new NotFoundException('Parent not found');

  const child = parent.children.find((c: any) => c._id?.toString() === kidId);
  if (!child) throw new NotFoundException('Child not found');

  // Analyze past puzzle performance
  const puzzles = (child.puzzles || []) as any[];
  const completedPuzzles = puzzles.filter((p: any) => p.isCompleted);
  
  let recommendedDifficulty = 'easy';
  let recommendedType = this.getPuzzleTypeForAge(child.age || 7);

  if (completedPuzzles.length >= 3) {
    const avgScore = completedPuzzles.reduce((sum: number, p: any) => sum + (p.score || 0), 0) / completedPuzzles.length;
    
    if (avgScore >= 80) {
      recommendedDifficulty = 'hard';
    } else if (avgScore >= 60) {
      recommendedDifficulty = 'medium';
    }

    // Find weakest puzzle type
    const typeScores: Record<string, { total: number; count: number }> = {};
    completedPuzzles.forEach((p: any) => {
      if (!typeScores[p.type]) {
        typeScores[p.type] = { total: 0, count: 0 };
      }
      typeScores[p.type].total += p.score || 0;
      typeScores[p.type].count += 1;
    });

    let lowestAvg = Infinity;
    for (const [type, data] of Object.entries(typeScores)) {
      const avg = data.total / data.count;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        recommendedType = type;
      }
    }
  }

  return this.generatePuzzle(parentId, kidId, {
    type: recommendedType,
    difficulty: recommendedDifficulty,
  });
}



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

    // Update each question with user's answer (persist userAnswerIndex)
    let correctCount = 0;
    for (let index = 0; index < quiz.questions.length; index++) {
      const question: any = quiz.questions[index];
      const userAns = answers[index];
      question.userAnswerIndex = userAns; // ensure the field is added under each question
      if (userAns === question.correctAnswerIndex) correctCount++;
    }

    // Mark modified so mongoose saves nested userAnswerIndex changes
    parent.markModified('children');

    // Calculate score as percentage
    const score = Math.round((correctCount / quiz.questions.length) * 100);

    // Update quiz properties
    quiz.isAnswered = true;
    // If Quiz schema no longer has 'answered', ignore; keeping line conditional
    if ('answered' in quiz) {
      (quiz as any).answered = quiz.questions.length;
    }
    quiz.score = score;

    // Update child's total score
    child.Score = (child.Score || 0) + score;

    await parent.save();

    // Return quiz with userAnswerIndex included for each question
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
}
