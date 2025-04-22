export const questions = {
    crypto: [
      "What are the latest updates in Ethereum?",
      "How does proof of stake work?",
      "What are the best DeFi protocols?",
      "Explain smart contract security",
      "What's your opinion on layer 2 solutions?",
      "How do you see blockchain evolving in the next decade?",
      "What's the most innovative crypto project you've seen recently?",
    ],
    tech: [
      "How does AI work?",
      "What's your favorite programming language?",
      "What are the most promising technologies in 2023?",
      "How important is cybersecurity?",
      "Are quantum computers going to change everything?",
      "What's your view on automation and its impact on jobs?",
    ],
    philosophical: [
      "What is the meaning of life?",
      "How do you define happiness?",
      "Is free will an illusion?",
      "What makes something ethical or unethical?",
      "How important is truth in a society?",
    ],
    personal: [
      "What are some good self-improvement strategies?",
      "How do you stay motivated?",
      "What are effective ways to manage stress?",
      "How important is work-life balance?",
      "What habits lead to success in your opinion?",
    ],
    casual: [
      "If you could travel anywhere, where would you go?",
      "What's your favorite food?",
      "What hobbies do you recommend trying?",
      "What books would you recommend?",
      "How do you like to spend your weekends?",
    ]
  };
  
  export function getRandomQuestion() {
    const categories = Object.keys(questions);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryQuestions = questions[category];
    const question = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
    
    return { category, question };
  }
  