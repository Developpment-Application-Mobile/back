
const API_URL = 'http://localhost:3000';

async function request(url: string, method: string, body?: any) {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
}

async function testRewards() {
    try {
        console.log('--- Starting Rewards System Test ---');

        // 1. Create Parent
        console.log('1. Creating Parent...');
        const parent = await request(`${API_URL}/parents`, 'POST', {
            name: 'Test Parent',
            email: `testparent_${Date.now()}@example.com`,
            password: 'password123'
        });
        const parentId = parent._id;
        console.log('   Parent created:', parentId);

        // 2. Add Child
        console.log('2. Adding Child...');
        const parentWithChild = await request(`${API_URL}/parents/${parentId}/kids`, 'POST', {
            name: 'Test Kid',
            age: 8,
            level: 'Beginner'
        });
        const child = parentWithChild.children[parentWithChild.children.length - 1];
        const kidId = child._id;
        console.log('   Child added:', kidId);

        // 3. Create Quiz
        console.log('3. Creating Quiz...');
        const quiz = await request(`${API_URL}/parents/${parentId}/kids/${kidId}/quizzes`, 'POST', {
            subject: 'Math',
            difficulty: 'Easy',
            nbrQuestions: 5,
            topic: 'Addition'
        });
        const quizId = quiz._id;
        console.log('   Quiz created:', quizId);

        // 4. Submit Quiz (Score 100%)
        console.log('4. Submitting Quiz (100% score)...');
        const questions = quiz.questions;
        const correctAnswers = questions.map((q: any) => q.correctAnswerIndex);

        const submitRes = await request(`${API_URL}/parents/${parentId}/kids/${kidId}/quizzes/${quizId}/submit`, 'POST', {
            answers: correctAnswers
        });
        console.log('   Quiz submitted. Score:', submitRes.score);

        // 5. Check Child Stats (Score, LifetimeScore, Level)
        console.log('5. Checking Child Stats...');
        const childAfterQuiz = await request(`${API_URL}/parents/child/${kidId}`, 'GET');
        console.log('   Score:', childAfterQuiz.Score);
        console.log('   LifetimeScore:', childAfterQuiz.lifetimeScore);
        console.log('   ProgressionLevel:', childAfterQuiz.progressionLevel);

        if (childAfterQuiz.Score !== 100) console.error('ERROR: Score mismatch');
        if (childAfterQuiz.lifetimeScore !== 100) console.error('ERROR: LifetimeScore mismatch');

        // 6. Create Gift
        console.log('6. Creating Gift...');
        const gift = await request(`${API_URL}/parents/${parentId}/gifts`, 'POST', {
            title: 'Cool Toy',
            cost: 50,
            imageUrl: 'http://example.com/toy.png'
        });
        const giftId = gift._id;
        console.log('   Gift created:', giftId);

        // 7. Buy Gift
        console.log('7. Buying Gift...');
        const buyRes = await request(`${API_URL}/parents/${parentId}/kids/${kidId}/gifts/${giftId}/buy`, 'POST');
        console.log('   Gift bought:', buyRes.message);

        // 8. Verify Purchase
        console.log('8. Verifying Purchase...');
        const childAfterBuy = await request(`${API_URL}/parents/child/${kidId}`, 'GET');
        console.log('   Score (should be 50):', childAfterBuy.Score);
        console.log('   Inventory:', childAfterBuy.inventory.length);

        if (childAfterBuy.Score !== 50) console.error('ERROR: Score not deducted correctly');
        if (childAfterBuy.inventory.length !== 1) console.error('ERROR: Gift not in inventory');

        // 9. Delete Gift
        console.log('9. Deleting Gift...');
        await request(`${API_URL}/parents/${parentId}/gifts/${giftId}`, 'DELETE');
        console.log('   Gift deleted.');

        // 10. Verify Gift Deleted
        try {
            const gifts = await request(`${API_URL}/parents/${parentId}/gifts`, 'GET');
            const found = gifts.find((g: any) => g._id === giftId);
            if (found) console.error('ERROR: Gift still exists');
            else console.log('   Gift verified deleted.');
        } catch (e) {
            console.log('   Error checking gifts (might be expected if list empty? no, should return empty list)');
        }

        console.log('--- Test Completed ---');

    } catch (error: any) {
        console.error('TEST FAILED:', error.message);
    }
}

testRewards();
