// server.js - Express server for Legal Literacy Engine feature
// Runs on port 5000 and provides in-memory state for scenarios and progress

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// In-memory data store for user progress
const users = {};

// Static mock categories and scenarios
// AI HOOK: Replace static scenarios array with call to OpenAI/Claude API
// to generate dynamic scenarios based on user's legal topic of interest
const scenarios = [
  {
    id: 1,
    category: "Consumer Rights",
    situation: "You ordered a smartphone online, but received a box containing a bar of soap. The seller refuses to issue a refund, claiming you received the correct item.",
    question: "What is your best immediate legal recourse?",
    options: [
      "A. Accept the loss as terms were agreed.",
      "B. File a complaint on the National Consumer Helpline.",
      "C. Directly sue the delivery boy.",
      "D. Post strongly worded comments on their social media."
    ],
    correctOption: "B",
    explanation: "Under the Consumer Protection Act, consumers have the right to seek redressal against unfair trade practices. The National Consumer Helpline provides immediate mediation and formal grievance filing support.",
    difficulty: "beginner"
  },
  {
    id: 2,
    category: "Workplace Rights",
    situation: "You have resigned from your company serving full notice period. Your employer is now withholding your final month's salary and full & final settlement without giving any formal reason.",
    question: "What is the correct formal step to take first?",
    options: [
      "A. Send a formal legal notice demanding payment under the Payment of Wages Act.",
      "B. Steal company property equivalent to the salary amount.",
      "C. Threaten the HR manager on WhatsApp.",
      "D. Wait indefinitely for the company's grace."
    ],
    correctOption: "A",
    explanation: "Withholding wages after normal exits is illegal. A formal legal notice gives the employer a timeline to clear dues, failing which you can approach the Labour Commissioner under the Payment of Wages Act.",
    difficulty: "intermediate"
  },
  {
    id: 3,
    category: "Tenant Rights",
    situation: "Your landlord suddenly tells you to vacate the apartment within 2 days, changing the locks while you were out, even though you have a valid 11-month rent agreement and no payment defaults.",
    question: "Is the landlord's action legal?",
    options: [
      "A. Yes, since it's their property, they can do as they please.",
      "B. No, illegal eviction without a court order or proper notice is a criminal offense.",
      "C. Yes, if they reimburse your deposit immediately.",
      "D. Only if their relatives need the house urgently."
    ],
    correctOption: "B",
    explanation: "Even owners cannot evict tenants arbitrarily without due process. Changing locks and illegal eviction is punishable. You can file an FIR for trespass and illegal eviction.",
    difficulty: "intermediate"
  },
  {
    id: 4,
    category: "Right to Information",
    situation: "You noticed the road in your colony was built only last month but has completely broken down. You want to know the contractor's details and the budget allocated.",
    question: "How can you formally acquire this information?",
    options: [
      "A. Ask the local politician during a rally.",
      "B. Bribe a municipal clerk for the files.",
      "C. File an RTI (Right to Information) application.",
      "D. Guess the amount and complain in a newspaper."
    ],
    correctOption: "C",
    explanation: "The RTI Act empowers citizens to request data from public authorities. You can formally file an RTI application online or offline to retrieve copies of contracts and budgets.",
    difficulty: "beginner"
  }
];

// Helper to init user
const initUser = (userId) => {
  if (!users[userId]) {
    users[userId] = {
      totalPoints: 0,
      completedScenarios: [],
      correctAnswers: 0,
      totalAnswers: 0,
      badges: []
    };
  }
};

app.get('/scenarios', (req, res) => {
  res.json(scenarios);
});

app.post('/submit-answer', (req, res) => {
  const { userId = 'guest', scenarioId, selectedOption } = req.body;
  initUser(userId);
  
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) return res.status(404).json({ error: "Scenario not found" });

  const isCorrect = scenario.correctOption.charAt(0) === selectedOption.charAt(0);
  const pointsEarned = isCorrect ? 10 : 0;

  res.json({
    isCorrect,
    explanation: scenario.explanation,
    pointsEarned
  });
});

app.post('/progress', (req, res) => {
  const { userId = 'guest', scenarioId, isCorrect } = req.body;
  initUser(userId);
  
  const user = users[userId];
  
  if (!user.completedScenarios.includes(scenarioId)) {
    user.completedScenarios.push(scenarioId);
    user.totalAnswers += 1;
    if (isCorrect) {
      user.correctAnswers += 1;
      user.totalPoints += 10;
    }

    // Badge Gamification Logic
    if (user.completedScenarios.length === 1 && !user.badges.includes("First Step")) {
      user.badges.push("First Step");
    }
    if (user.correctAnswers >= 5 && !user.badges.includes("Sharp Mind")) {
      user.badges.push("Sharp Mind");
    }
    if (user.completedScenarios.length >= scenarios.length && user.correctAnswers >= scenarios.length && !user.badges.includes("Legal Eagle")) {
      user.badges.push("Legal Eagle");
    }
  }

  // Calculate generic level
  let level = "Beginner";
  if (user.totalPoints >= 51 && user.totalPoints <= 150) level = "Aware";
  if (user.totalPoints > 150) level = "Advanced";

  res.json({
    totalPoints: user.totalPoints,
    level,
    badges: user.badges,
    completedScenarios: user.completedScenarios,
    accuracy: user.totalAnswers > 0 ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 0
  });
});

app.get('/progress/:userId', (req, res) => {
  const { userId } = req.params;
  initUser(userId);
  const user = users[userId];

  let level = "Beginner";
  if (user.totalPoints >= 51 && user.totalPoints <= 150) level = "Aware";
  if (user.totalPoints > 150) level = "Advanced";

  res.json({
    totalPoints: user.totalPoints,
    level,
    badges: user.badges,
    completedScenarios: user.completedScenarios,
    accuracy: user.totalAnswers > 0 ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 0
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
