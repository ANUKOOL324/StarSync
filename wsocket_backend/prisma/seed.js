require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});

const problems = [
  {
    slug: "merge-two-sorted-arrays",
    title: "Merging Two Sorted Arrays",
    difficulty: "EASY",
    topics: ["Array", "Two Pointers"],
    description: "Given two sorted arrays, merge them into one sorted array in non-decreasing order.",
    inputFormat: "The first line contains the lengths of both arrays. The next two lines contain the sorted values.",
    outputFormat: "Print every value from the merged sorted array on one line.",
    constraints: [
      "1 <= first array length, second array length <= 50",
      "Both arrays are already sorted in non-decreasing order",
    ],
    examples: [
      {
        input: "5 2\n1 2 3 4 6\n7 8",
        output: "1 2 3 4 6 7 8",
        explanation: "Both arrays are merged while preserving sorted order.",
      },
    ],
    starterCode: {
      javascript: "function mergeSortedArrays(first, second) {\n  // Write your code here\n}\n\nconsole.log('ready');",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
    },
    editorial: "Use two pointers. Always take the smaller current value, then append remaining values.",
    testCases: [
      { input: "5 2\n1 2 3 4 6\n7 8", expectedOutput: "1 2 3 4 6 7 8", isHidden: false, order: 1 },
      { input: "3 3\n1 4 9\n2 3 10", expectedOutput: "1 2 3 4 9 10", isHidden: true, order: 2 },
    ],
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "EASY",
    topics: ["String", "Stack"],
    description: "Given a string containing brackets, determine whether every opening bracket is closed in the correct order.",
    inputFormat: "A single line containing bracket characters.",
    outputFormat: "Print true if the string is valid, otherwise print false.",
    constraints: ["1 <= string length <= 1000", "The string only contains bracket characters"],
    examples: [{ input: "({[]})", output: "true", explanation: "Every bracket closes in the correct order." }],
    starterCode: {
      javascript: "function isValidBrackets(text) {\n  // Write your code here\n}\n\nconsole.log('ready');",
      cpp: "#include <iostream>\n#include <stack>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
    },
    editorial: "Push opening brackets onto a stack. For each closing bracket, the stack top must match.",
    testCases: [
      { input: "({[]})", expectedOutput: "true", isHidden: false, order: 1 },
      { input: "([)]", expectedOutput: "false", isHidden: true, order: 2 },
    ],
  },
  {
    slug: "two-sum-hashmap",
    title: "Two Sum With Hash Map",
    difficulty: "EASY",
    topics: ["Array", "Hashing"],
    description: "Find two distinct numbers in an array whose sum equals the target value.",
    inputFormat: "The first line contains n and target. The second line contains n numbers.",
    outputFormat: "Print the two zero-based indices in increasing order.",
    constraints: ["2 <= n <= 1000", "Exactly one valid answer exists"],
    examples: [{ input: "4 9\n2 7 11 15", output: "0 1", explanation: "2 + 7 equals 9." }],
    starterCode: {
      javascript: "function twoSum(numbers, target) {\n  // Write your code here\n}\n\nconsole.log('ready');",
      cpp: "#include <iostream>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
    },
    editorial: "Store previously seen values in a hash map and check whether target - current exists.",
    testCases: [
      { input: "4 9\n2 7 11 15", expectedOutput: "0 1", isHidden: false, order: 1 },
      { input: "5 6\n3 2 4 1 5", expectedOutput: "1 2", isHidden: true, order: 2 },
    ],
  },
  {
    slug: "longest-unique-window",
    title: "Longest Unique Window",
    difficulty: "MEDIUM",
    topics: ["String", "Sliding Window", "Hashing"],
    description: "Find the length of the longest substring that contains no repeated characters.",
    inputFormat: "A single line containing a lowercase string.",
    outputFormat: "Print the maximum length.",
    constraints: ["1 <= string length <= 100000"],
    examples: [{ input: "abcabcbb", output: "3", explanation: "abc is the longest substring without repeated characters." }],
    starterCode: {
      javascript: "function longestUniqueWindow(text) {\n  // Write your code here\n}\n\nconsole.log('ready');",
      cpp: "#include <iostream>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
    },
    editorial: "Use a sliding window and move the left pointer when a repeated character appears.",
    testCases: [
      { input: "abcabcbb", expectedOutput: "3", isHidden: false, order: 1 },
      { input: "bbbbb", expectedOutput: "1", isHidden: true, order: 2 },
    ],
  },
  {
    slug: "connected-components",
    title: "Connected Components",
    difficulty: "MEDIUM",
    topics: ["Graph", "DFS"],
    description: "Given an undirected graph, count how many connected components it has.",
    inputFormat: "The first line contains n and m. The next m lines contain edges.",
    outputFormat: "Print the number of connected components.",
    constraints: ["1 <= n <= 1000", "0 <= m <= 5000"],
    examples: [{ input: "5 3\n1 2\n2 3\n4 5", output: "2", explanation: "Nodes 1-3 form one component and 4-5 form another." }],
    starterCode: {
      javascript: "function countComponents(nodeCount, edges) {\n  // Write your code here\n}\n\nconsole.log('ready');",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
    },
    editorial: "Build an adjacency list and run DFS/BFS from every unvisited node.",
    testCases: [
      { input: "5 3\n1 2\n2 3\n4 5", expectedOutput: "2", isHidden: false, order: 1 },
      { input: "4 0", expectedOutput: "4", isHidden: true, order: 2 },
    ],
  },
  {
    slug: "coin-change-minimum",
    title: "Minimum Coin Change",
    difficulty: "MEDIUM",
    topics: ["Dynamic Programming", "Array"],
    description: "Find the minimum number of coins needed to make a target amount.",
    inputFormat: "The first line contains n and amount. The second line contains n coin values.",
    outputFormat: "Print the minimum coin count, or -1 if the amount cannot be formed.",
    constraints: ["1 <= n <= 20", "1 <= amount <= 10000"],
    examples: [{ input: "3 11\n1 2 5", output: "3", explanation: "11 can be formed using 5 + 5 + 1." }],
    starterCode: {
      javascript: "function minCoins(coins, amount) {\n  // Write your code here\n}\n\nconsole.log('ready');",
      cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}",
    },
    editorial: "Use dynamic programming where dp[x] stores the minimum coins needed for amount x.",
    testCases: [
      { input: "3 11\n1 2 5", expectedOutput: "3", isHidden: false, order: 1 },
      { input: "1 3\n2", expectedOutput: "-1", isHidden: true, order: 2 },
    ],
  },
];

async function main() {
  for (const problem of problems) {
    const { testCases, ...problemData } = problem;

    const savedProblem = await prisma.problem.upsert({
      where: { slug: problem.slug },
      create: {
        ...problemData,
        testCases: {
          create: testCases,
        },
      },
      update: {
        ...problemData,
        isActive: true,
      },
    });

    await prisma.testCase.deleteMany({
      where: { problemId: savedProblem.id },
    });

    await prisma.testCase.createMany({
      data: testCases.map((testCase) => ({
        ...testCase,
        problemId: savedProblem.id,
      })),
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });