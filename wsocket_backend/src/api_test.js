const fs = require('fs');

async function testFlow() {
  const backendUrl = 'http://localhost:3001';
  const timestamp = Date.now();
  const usernameA = `tester_a_${timestamp}`;
  const emailA = `tester_a_${timestamp}@example.com`;
  const passwordA = 'password123';

  const usernameB = `tester_b_${timestamp}`;
  const emailB = `tester_b_${timestamp}@example.com`;
  const passwordB = 'password123';

  console.log('--- SIGNING UP USER A & USER B ---');
  
  // 1. Sign up User A
  const signupARes = await fetch(`${backendUrl}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: usernameA, email: emailA, password: passwordA })
  });
  if (!signupARes.ok) {
    throw new Error(`User A signup failed: ${await signupARes.text()}`);
  }
  const userA = await signupARes.json();
  console.log(`User A created: ${userA.user.username} (${userA.user.email})`);
  const tokenA = userA.token;

  // 2. Sign up User B
  const signupBRes = await fetch(`${backendUrl}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: usernameB, email: emailB, password: passwordB })
  });
  if (!signupBRes.ok) {
    throw new Error(`User B signup failed: ${await signupBRes.text()}`);
  }
  const userB = await signupBRes.json();
  console.log(`User B created: ${userB.user.username} (${userB.user.email})`);
  const tokenB = userB.token;

  console.log('\n--- CREATING COMPETING ROOM WITH USER A ---');
  // 3. Create room with User A
  const roomPayload = {
    name: 'Run Code Test Room',
    purpose: 'COMPETING',
    difficulty: 'EASY',
    topics: ['Array', 'Two Pointers'],
    durationMinutes: 15,
    unlimitedMembers: true,
    maxMembers: null
  };

  const createRoomRes = await fetch(`${backendUrl}/api/v1/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify(roomPayload)
  });
  if (!createRoomRes.ok) {
    throw new Error(`Room creation failed: ${await createRoomRes.text()}`);
  }
  const roomData = await createRoomRes.json();
  const room = roomData.room;
  console.log(`Room created successfully!`);
  console.log(`Room ID: ${room.id}`);
  console.log(`Room Purpose: ${room.purpose}`);
  console.log(`Room Difficulty: ${room.difficulty}`);
  console.log(`Room Topics: ${JSON.stringify(room.topics)}`);
  console.log(`Room Duration: ${room.durationMinutes} mins`);

  console.log('\n--- FETCHING PROBLEMS ASSIGNED TO THE ROOM ---');
  // 4. Fetch problems
  const getProblemsRes = await fetch(`${backendUrl}/api/v1/rooms/${room.id}/problems`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenA}`
    }
  });
  if (!getProblemsRes.ok) {
    throw new Error(`Fetching problems failed: ${await getProblemsRes.text()}`);
  }
  const problemsData = await getProblemsRes.json();
  const problems = problemsData.problems;
  console.log(`Number of assigned problems: ${problems.length}`);
  
  if (problems.length !== 4) {
    console.error(`Warning: Expected 4 problems, but got ${problems.length}`);
  }

  problems.forEach((p, index) => {
    console.log(`P${index + 1}: [ID: ${p.id}] ${p.title} (${p.difficulty})`);
  });

  const p1 = problems[0];
  console.log(`\nSelected P1: ${p1.title}`);
  console.log(`P1 Description: ${p1.description}`);

  // 5. Test correct code for P1 with User A
  console.log('\n--- TESTING CORRECT CODE FOR P1 ---');
  const correctJSCode = `
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
if (!input) process.exit(0);
const lines = input.split('\\n');
const [n, m] = lines[0].split(' ').map(Number);
const arr1 = lines[1] ? lines[1].split(' ').map(Number) : [];
const arr2 = lines[2] ? lines[2].split(' ').map(Number) : [];

const merged = [];
let i = 0, j = 0;
while (i < arr1.length && j < arr2.length) {
    if (arr1[i] <= arr2[j]) {
        merged.push(arr1[i++]);
    } else {
        merged.push(arr2[j++]);
    }
}
while (i < arr1.length) merged.push(arr1[i++]);
while (j < arr2.length) merged.push(arr2[j++]);

console.log(merged.join(' '));
  `;

  const runCorrectRes = await fetch(`${backendUrl}/api/v1/rooms/${room.id}/problems/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      problemId: p1.id,
      language: 'javascript',
      code: correctJSCode
    })
  });

  if (!runCorrectRes.ok) {
    throw new Error(`Running correct code failed: ${await runCorrectRes.text()}`);
  }
  const runCorrectResult = await runCorrectRes.json();
  console.log('Correct code execution result:');
  console.log(`Passed Count: ${runCorrectResult.passedCount} / ${runCorrectResult.totalCount}`);
  console.log('Results details:');
  runCorrectResult.results.forEach((r, idx) => {
    console.log(`Testcase ${idx + 1}:
      Input: ${JSON.stringify(r.input)}
      Expected: ${JSON.stringify(r.expectedOutput)}
      Actual: ${JSON.stringify(r.actualOutput)}
      Passed: ${r.passed}
      Error: ${r.error}
    `);
  });

  // 6. Test wrong code for P1 with User A
  console.log('\n--- TESTING WRONG CODE FOR P1 ---');
  const wrongJSCode = `console.log("wrong answer");`;
  const runWrongRes = await fetch(`${backendUrl}/api/v1/rooms/${room.id}/problems/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      problemId: p1.id,
      language: 'javascript',
      code: wrongJSCode
    })
  });

  if (!runWrongRes.ok) {
    throw new Error(`Running wrong code failed: ${await runWrongRes.text()}`);
  }
  const runWrongResult = await runWrongRes.json();
  console.log('Wrong code execution result:');
  console.log(`Passed Count: ${runWrongResult.passedCount} / ${runWrongResult.totalCount}`);
  console.log('Results details:');
  runWrongResult.results.forEach((r, idx) => {
    console.log(`Testcase ${idx + 1}:
      Input: ${JSON.stringify(r.input)}
      Expected: ${JSON.stringify(r.expectedOutput)}
      Actual: ${JSON.stringify(r.actualOutput)}
      Passed: ${r.passed}
      Error: ${r.error}
    `);
  });

  // 7. Security Checks:
  console.log('\n--- SECURITY/API CHECKS ---');
  
  // Check A: Non-member cannot run code for this room problem
  console.log('Check A: Non-member (User B) attempting to run code for User A\'s room...');
  const runNonMemberRes = await fetch(`${backendUrl}/api/v1/rooms/${room.id}/problems/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenB}` // User B token
    },
    body: JSON.stringify({
      problemId: p1.id,
      language: 'javascript',
      code: correctJSCode
    })
  });
  console.log(`Response Status: ${runNonMemberRes.status}`);
  const nonMemberBody = await runNonMemberRes.text();
  console.log(`Response Body: ${nonMemberBody}`);
  const nonMemberBlocked = runNonMemberRes.status === 403;
  console.log(`Non-member blocked as expected (403): ${nonMemberBlocked}`);

  // Check B: Unassigned problem returns 404
  console.log('\nCheck B: User A attempting to run code for an unassigned problem...');
  const fakeProblemId = '00000000-0000-0000-0000-000000000000';
  const runUnassignedRes = await fetch(`${backendUrl}/api/v1/rooms/${room.id}/problems/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      problemId: fakeProblemId,
      language: 'javascript',
      code: correctJSCode
    })
  });
  console.log(`Response Status: ${runUnassignedRes.status}`);
  const unassignedBody = await runUnassignedRes.text();
  console.log(`Response Body: ${unassignedBody}`);
  const unassignedBlocked = runUnassignedRes.status === 404;
  console.log(`Unassigned problem blocked as expected (404): ${unassignedBlocked}`);

  // Check C: Hidden testcases are not executed/exposed in response
  console.log('\nCheck C: Inspecting run response structure to ensure no hidden testcases are leaked...');
  console.log(`Total results returned: ${runCorrectResult.results.length}`);
  const hasHidden = runCorrectResult.results.some(r => r.order === 2 || r.isHidden === true);
  console.log(`Contains any hidden testcase: ${hasHidden}`);
  const hiddenNotExposed = !hasHidden && runCorrectResult.results.length === 1;
  console.log(`Hidden testcase isolated: ${hiddenNotExposed}`);

  console.log('\n--- SECURITY CHECKS SUMMARY ---');
  console.log(`- Non-member blocked: ${nonMemberBlocked ? 'YES' : 'NO'}`);
  console.log(`- Unassigned problem blocked: ${unassignedBlocked ? 'YES' : 'NO'}`);
  console.log(`- Hidden testcases not exposed: ${hiddenNotExposed ? 'YES' : 'NO'}`);
}

testFlow().catch(console.error);
