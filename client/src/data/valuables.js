const valuables = [
  {
    category: "Life Wisdom",
    title: "The 2-Minute Rule",
    body: "If something takes less than two minutes to do, do it now. This simple principle from David Allen's productivity method prevents small tasks from piling up into an overwhelming backlog. It applies to replying to messages, putting things away, or quick decisions. Over time, this habit frees up enormous mental energy.",
    source: "Getting Things Done \u2014 David Allen"
  },
  {
    category: "Psychology",
    title: "The Zeigarnik Effect",
    body: "Your brain remembers unfinished tasks better than completed ones. This is why incomplete projects nag at you. Use it to your advantage: start a task even for just 5 minutes, and your subconscious will keep working on it. Writing down your pending tasks also helps release this mental tension.",
    source: "Bluma Zeigarnik, 1927"
  },
  {
    category: "Health Tip",
    title: "The 20-20-20 Rule for Eye Health",
    body: "Every 20 minutes, look at something 20 feet away for 20 seconds. This simple practice significantly reduces digital eye strain, headaches, and blurred vision caused by prolonged screen time. Set a gentle timer and make it a habit \u2014 your eyes will thank you.",
    source: "American Academy of Ophthalmology"
  },
  {
    category: "Financial Literacy",
    title: "The Power of Compound Interest",
    body: "Albert Einstein reportedly called compound interest the eighth wonder of the world. If you save just a small amount regularly and let it grow, time does the heavy lifting. Starting 10 years earlier can mean hundreds of thousands more at retirement \u2014 even with the same total contributions.",
    source: "The Psychology of Money \u2014 Morgan Housel"
  },
  {
    category: "Communication",
    title: "The 5:1 Ratio in Relationships",
    body: "Research by Dr. John Gottman shows that stable, happy relationships maintain a ratio of at least 5 positive interactions for every 1 negative one. This applies to friendships, work relationships, and romantic partnerships. A simple compliment, thank you, or moment of laughter all count.",
    source: "The Gottman Institute"
  },
  {
    category: "Productivity",
    title: "Eat the Frog First",
    body: "Mark Twain said if you eat a live frog first thing in the morning, nothing worse will happen to you the rest of the day. In productivity terms: tackle your hardest, most important task first when your energy and willpower are highest. Everything else feels easier after that.",
    source: "Eat That Frog! \u2014 Brian Tracy"
  },
  {
    category: "Mindset",
    title: "Growth vs. Fixed Mindset",
    body: "People with a growth mindset believe abilities can be developed through effort and learning. Those with a fixed mindset believe talent is innate. The difference? Growth-minded people embrace challenges, persist through setbacks, and ultimately achieve more. The good news: mindset itself can be changed.",
    source: "Mindset \u2014 Carol Dweck"
  },
  {
    category: "Wellness",
    title: "The Science of Deep Breathing",
    body: "Taking 6 slow, deep breaths per minute activates your parasympathetic nervous system, lowering cortisol, reducing blood pressure, and calming anxiety within minutes. Try box breathing: inhale for 4 counts, hold 4, exhale 4, hold 4. It's used by Navy SEALs and surgeons alike.",
    source: "Harvard Medical School"
  },
  {
    category: "Life Skill",
    title: "The STAR Method for Any Interview",
    body: "Structure your answers using Situation, Task, Action, Result. Describe the context, what was needed, what you specifically did, and the outcome. This framework makes your communication clear, memorable, and impactful \u2014 useful not just in interviews but whenever you need to explain an achievement.",
    source: "Career Development Research"
  },
  {
    category: "Science",
    title: "Your Brain Rewires Itself Every Day",
    body: "Neuroplasticity means your brain physically changes based on what you repeatedly do and think. Every new skill you practice strengthens neural pathways. This means it's never too late to learn something new, break a bad habit, or develop a new way of thinking. Consistency is the key.",
    source: "The Brain That Changes Itself \u2014 Norman Doidge"
  },
  {
    category: "Social Skills",
    title: "The Name Repetition Technique",
    body: "Dale Carnegie said a person's name is the sweetest sound to them. When you meet someone, use their name naturally 2-3 times in the first conversation. It helps you remember their name, makes them feel valued, and creates an instant sense of connection and warmth.",
    source: "How to Win Friends \u2014 Dale Carnegie"
  },
  {
    category: "Time Management",
    title: "Parkinson's Law",
    body: "Work expands to fill the time available for its completion. If you give yourself a week for a 2-hour task, it will take a week. Set shorter, intentional deadlines and you'll be amazed at how much more efficiently you work. Pair this with timeboxing for maximum effect.",
    source: "Cyril Northcote Parkinson, 1955"
  },
  {
    category: "Emotional Intelligence",
    title: "Name It to Tame It",
    body: "When you feel a strong emotion, simply labeling it (\"I'm feeling anxious\" or \"This is frustration\") activates your prefrontal cortex and reduces the intensity of the emotion. This technique, backed by neuroscience research, gives you a moment of clarity before reacting.",
    source: "Dr. Dan Siegel, UCLA"
  },
  {
    category: "Nutrition",
    title: "The Plate Method for Balanced Eating",
    body: "Fill half your plate with vegetables and fruits, a quarter with lean protein, and a quarter with whole grains. Add a small portion of healthy fat. This visual approach is simpler than counting calories and naturally creates balanced, nutritious meals without overthinking.",
    source: "Harvard School of Public Health"
  },
  {
    category: "Philosophy",
    title: "The Stoic Practice of Negative Visualization",
    body: "Ancient Stoics practiced imagining losing what they had \u2014 not to be pessimistic, but to cultivate gratitude for what they already possess. Spending a few moments considering how things could be worse paradoxically increases your happiness and appreciation for your current life.",
    source: "A Guide to the Good Life \u2014 William Irvine"
  },
  {
    category: "Sleep Science",
    title: "The 90-Minute Sleep Cycle",
    body: "Your sleep runs in roughly 90-minute cycles. Waking up at the end of a cycle (rather than in the middle) helps you feel more refreshed. Count back in 90-minute blocks from when you need to wake up to find your ideal bedtime. For example, waking at 6:30 AM? Try sleeping at 11:00 PM or 9:30 PM.",
    source: "Why We Sleep \u2014 Matthew Walker"
  },
  {
    category: "Decision Making",
    title: "The 10/10/10 Rule",
    body: "When facing a tough decision, ask yourself: How will I feel about this in 10 minutes? 10 months? 10 years? This simple framework helps separate short-term emotions from long-term consequences, giving you clarity and perspective when choices feel overwhelming.",
    source: "Decisive \u2014 Chip & Dan Heath"
  },
  {
    category: "Creativity",
    title: "The Power of Walking",
    body: "A Stanford study found that walking increases creative output by an average of 60%. Whether indoors or outdoors, the physical act of walking opens up the free flow of ideas. Many great thinkers \u2014 from Beethoven to Steve Jobs \u2014 were famous for their thinking walks.",
    source: "Stanford University, 2014"
  },
  {
    category: "Money Tip",
    title: "The 50/30/20 Budget Rule",
    body: "A simple budgeting framework: 50% of your income goes to needs (rent, food, bills), 30% to wants (entertainment, dining out, hobbies), and 20% to savings and debt repayment. It's not perfect for everyone, but it's a great starting point if budgeting feels overwhelming.",
    source: "All Your Worth \u2014 Elizabeth Warren"
  },
  {
    category: "Self-Improvement",
    title: "The 1% Better Principle",
    body: "If you improve by just 1% each day, you'll be 37 times better after one year. Small, consistent improvements compound dramatically over time. Don't aim for dramatic overnight change \u2014 focus on being slightly better today than you were yesterday. That's where real transformation happens.",
    source: "Atomic Habits \u2014 James Clear"
  }
];

export default valuables;
