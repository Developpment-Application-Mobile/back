
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

async function reproduceClaimBug() {
    try {
        console.log('--- Starting Claim Reward Reproduction ---');

        // 1. Create Parent
        console.log('1. Creating Parent...');
        const parent = await request(`${API_URL}/parents`, 'POST', {
            name: 'Test Parent Claim',
            email: `claim_test_${Date.now()}@example.com`,
            password: 'password123'
        });
        const parentId = parent._id;
        console.log('   Parent created:', parentId);

        // 2. Add Child
        console.log('2. Adding Child...');
        const parentWithChild = await request(`${API_URL}/parents/${parentId}/kids`, 'POST', {
            name: 'Quest Kid',
            age: 9,
            level: 'Beginner'
        });
        const child = parentWithChild.children[parentWithChild.children.length - 1];
        const kidId = child._id;
        console.log('   Child added:', kidId);

        // Child should have quests generated automatically
        let quests = await request(`${API_URL}/parents/${parentId}/kids/${kidId}/quests`, 'GET');
        console.log('   Initial Quests count:', quests.length);

        // Find "Perfect Score" quest
        const perfectScoreQuest = quests.find((q: any) => q.type === 'PERFECT_SCORE');
        if (!perfectScoreQuest) throw new Error('Perfect Score quest not found');
        console.log('   Found Perfect Score quest:', perfectScoreQuest._id);

        // 3. Complete a Quiz with Perfect Score to trigger quest completion
        console.log('3. Creating and Completing Quiz for Perfect Score...');
        const quiz = await request(`${API_URL}/parents/${parentId}/kids/${kidId}/quizzes`, 'POST', {
            subject: 'Math',
            difficulty: 'Easy',
            nbrQuestions: 3,
            topic: 'Addition'
        });

        const submitRes = await request(`${API_URL}/parents/${parentId}/kids/${kidId}/quizzes/${quiz._id}/submit`, 'POST', {
            answers: quiz.questions.map((q: any) => q.correctAnswerIndex)
        });
        console.log('   Quiz submitted with score:', submitRes.score);

        // 4. Check Quest Status
        quests = await request(`${API_URL}/parents/${parentId}/kids/${kidId}/quests`, 'GET');
        const completedQuest = quests.find((q: any) => q._id === perfectScoreQuest._id);
        console.log('   Quest Status:', completedQuest.status); // Should be COMPLETED

        if (completedQuest.status !== 'COMPLETED') {
            throw new Error('Quest status should be COMPLETED but is ' + completedQuest.status);
        }

        // 5. Claim Reward
        console.log('5. Claiming Reward...');
        const claimRes = await request(`${API_URL}/parents/${parentId}/kids/${kidId}/quests/${completedQuest._id}/claim`, 'POST');
        console.log('   Claim Response keys:', Object.keys(claimRes));

        // CHECK: Does response have 'children' or looks like a Child object?
        const isChildObject = claimRes.hasOwnProperty('quests') && Array.isArray(claimRes.quests);
        console.log('   Response is full Child object with quests?', isChildObject);

        if (!isChildObject) {
            console.log('   [BUG REPRODUCED] Response is NOT a full Child object. Likely partial updates.');
            console.log('   Response content:', JSON.stringify(claimRes, null, 2));
        } else {
            console.log('   Response IS a Child object.');
        }

        console.log('--- Reproduction Completed ---');

    } catch (error: any) {
        console.error('REPRODUCTION FAILED:', error.message);
    }
}

reproduceClaimBug();
