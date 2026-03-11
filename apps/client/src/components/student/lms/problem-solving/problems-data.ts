export type Example = {
  id: number;
  inputText: string;
  outputText: string;
  explanation?: string;
};

export type Problem = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  problemStatement: string;
  examples: Example[];
  constraints: string;
  starterCode: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array",
    problemStatement:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      {
        id: 1,
        inputText: "nums = [2,7,11,15], target = 9",
        outputText: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        id: 2,
        inputText: "nums = [3,2,4], target = 6",
        outputText: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
      },
    ],
    constraints:
      "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9, Only one valid answer exists.",
    starterCode: `function twoSum(nums: number[], target: number): number[] {
  // Write your code here
  return [];
}`,
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "Stack",
    problemStatement:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      {
        id: 1,
        inputText: "s = '()'",
        outputText: "true",
      },
      {
        id: 2,
        inputText: "s = '()[]{}'",
        outputText: "true",
      },
      {
        id: 3,
        inputText: "s = '(]'",
        outputText: "false",
      },
    ],
    constraints:
      "1 <= s.length <= 10^4, s consists of parentheses only.",
    starterCode: `function isValid(s: string): boolean {
  // Write your code here
  return false;
}`,
  },
  {
    id: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Medium",
    category: "Array",
    problemStatement:
      "You are given an array prices where prices[i] is the price of a given stock on the i-th day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
    examples: [
      {
        id: 1,
        inputText: "prices = [7,1,5,3,6,4]",
        outputText: "5",
        explanation:
          "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
      },
      {
        id: 2,
        inputText: "prices = [7,6,4,3,1]",
        outputText: "0",
        explanation:
          "In this case, no transactions are done and the max profit = 0.",
      },
    ],
    constraints:
      "1 <= prices.length <= 10^5, 0 <= prices[i] <= 10^4.",
    starterCode: `function maxProfit(prices: number[]): number {
  // Write your code here
  return 0;
}`,
  },
];
