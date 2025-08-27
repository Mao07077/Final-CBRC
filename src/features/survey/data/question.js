const questions = [
    {
        category: "Study with Friends",
        questions: [
            {
                question: "Do you prefer studying alone or with friends?",
                type: 'single-choice',
                choices: [
                    "I always study alone.",
                    "I mostly study alone but sometimes with friends.",
                    "I study with friends often.",
                    "I always study in a group."
                ]
            },
            {
                question: "How often do you study with friends?",
                type: 'single-choice',
                choices: ["Never", "Once a month", "Once a week", "Every study session"]
            },
            {
                question: "What is the biggest benefit of studying with friends?",
                type: 'single-choice',
                choices: [
                    "Sharing different ideas and knowledge",
                    "Getting motivated to study",
                    "Understanding concepts better through discussions",
                    "It's just more fun than studying alone"
                ]
            },
            {
                question: "How do you handle distractions when studying with friends?",
                type: 'single-choice',
                choices: [
                    "I get easily distracted and don’t study much.",
                    "I try to focus, but sometimes I lose track.",
                    "I set rules with my friends to avoid distractions.",
                    "I stay completely focused while studying with friends."
                ]
            },
            {
                question: "Have you noticed a difference in your understanding when studying with friends vs. alone?",
                type: 'single-choice',
                choices: [
                    "I learn better alone.",
                    "I learn better with friends.",
                    "It depends on the subject.",
                    "I haven’t noticed any difference."
                ]
            }
        ]
    },
    {
        category: "Asking for Help",
        questions: [
            {
                question: "When do you usually ask for help while studying?",
                type: 'single-choice',
                choices: [
                    "As soon as I don’t understand something.",
                    "After trying to solve it myself.",
                    "Only when I am really struggling.",
                    "I rarely ask for help."
                ]
            },
            {
                question: "Who do you prefer to ask for help?",
                type: 'single-choice',
                choices: [
                    "Teachers or professors",
                    "Classmates or friends",
                    "Online resources or videos",
                    "I try to figure things out alone"
                ]
            },
            {
                question: "How comfortable are you with asking questions in class?",
                type: 'single-choice',
                choices: [
                    "Very comfortable—I ask whenever I need to.",
                    "Somewhat comfortable—I ask occasionally.",
                    "Not comfortable—I prefer to ask after class.",
                    "I avoid asking questions at all."
                ]
            },
            {
                question: "What is your biggest challenge when asking for help?",
                type: 'single-choice',
                choices: [
                    "I feel shy or embarrassed.",
                    "I don’t know who to ask.",
                    "I think I should figure it out myself.",
                    "I don’t have enough time to ask."
                ]
            },
            {
                question: "What has been the most helpful source when seeking help?",
                type: 'single-choice',
                choices: [
                    "Teachers or tutors",
                    "Study groups or classmates",
                    "Online resources (videos, articles)",
                    "Practice tests and self-review"
                ]
            }
        ]
    },
    {
        category: "Test yourself periodically",
        questions: [
            {
                question: "How often do you test yourself while studying",
                type: 'single-choice',
                choices: [
                    "After every study session",
                    "Once a week",
                    "Before exams only",
                    "I don’t test myself"
                ]
            },
            {
                question: "What method do you use for self-testing?",
                type: 'single-choice',
                choices: [
                    "Practice quizzes or mock exams",
                    "I use flashcards",
                    "Summarizing information in my own words",
                    "I don’t have a specific method"
                ]
            },
            {
                question: "How do you feel after testing yourself?",
                type: 'single-choice',
                choices: [
                    "Confident about my knowledge",
                    "I realize what I need to review",
                    "I feel anxious about my performance",
                    "I don’t feel any different"
                ]
            },
            {
                question: "Do you think self-testing has improved your learning?",
                type: 'single-choice',
                choices: [
                    "Yes, it has helped me retain information better",
                    "It’s hard to tell if it makes a difference",
                    "I don’t think self-testing is effective",
                    "I haven’t tried self-testing"
                ]
            },
            {
                question: "What motivates you to test yourself regularly?",
                type: 'single-choice',
                choices: [
                    "I want to track my progress",
                    "It helps me remember information longer",
                    "I want to challenge my knowledge",
                    "I don’t find self-testing helpful"
                ]
            }
        ]
    },
    {
        category: "Creating a Study Schedule",
        questions: [
            {
                question: "How do you usually plan your study schedule?",
                type: 'single-choice',
                choices: [
                    "I follow a fixed daily or weekly schedule.",
                    "I create a study plan but adjust it as needed.",
                    "I study whenever I feel like it",
                    "I don’t follow a study schedule"
                ]
            },
            {
                question: "How do you organize your study schedule?",
                type: 'single-choice',
                choices: [
                    "By breaking down topics into study sessions",
                    "By setting specific study times",
                    "By creating a to-do list for each study session",
                    "I don’t have a study schedule"
                ]
            },
            {
                question: "How often do you stick to your study schedule?",
                type: 'single-choice',
                choices: [
                    "Most of the time",
                    "Sometimes",
                    "Rarely",
                    "I don’t have a study schedule"
                ]
            },
            {
                question: "What challenges do you face in following a study schedule?",
                type: 'single-choice',
                choices: [
                    "Procrastination and lack of motivation",
                    "Unexpected distractions or events",
                    "Difficulty in organizing study materials",
                    "I don’t face any challenges"
                ]
            },
            {
                question: "What benefits have you noticed from following a study schedule?",
                type: 'single-choice',
                choices: [
                    "Better time management and productivity",
                    "Consistent progress in learning",
                    "Reduced stress and anxiety",
                    "I haven’t noticed any benefits"
                ]
            }
        ]
    },
    {
        category: "Time Management",
        questions: [
            {
                question: "How do you manage your study time?",
                type: 'single-choice',
                choices: [
                    "I study for fixed hours each day",
                    "I study until I complete a certain goal",
                    "I study whenever I have free time",
                    "I don’t have a specific study routine"
                ]
            },
            {
                question: "How do you handle distractions while studying?",
                type: 'single-choice',
                choices: [
                    "I minimize distractions and stay focused",
                    "I take breaks when distracted",
                    "I study in short intervals to avoid distractions",
                    "I get easily distracted and lose focus"
                ]
            },
            {
                question: "What is your biggest challenge in managing study time?",
                type: 'single-choice',
                choices: [
                    "Procrastination and lack of discipline",
                    "Too many distractions in my study environment",
                    "Difficulty in concentrating for long periods",
                    "I don’t face any challenges"
                ]
            },
            {
                question: "How do you track your study time?",
                type: 'single-choice',
                choices: [
                    "Using a timer or study app",
                    "Estimating time based on study progress",
                    "I don’t track my study time",
                    "I study until I feel tired"
                ]
            },
            {
                question: "What strategy helps you manage your time most effectively?",
                type: 'single-choice',
                choices: [
                    "Prioritizing tasks based on deadlines",
                    "Breaking tasks into smaller steps",
                    "Using a planner or calendar",
                    "Setting reminders for study sessions",

                ]
            }
        ]
    },
    {
        category: "Setting Study Goals",
        questions: [
            {
                question: "Do you set specific study goals?",
                type: 'single-choice',
                choices: [
                    "Yes, I set daily or weekly study goals",
                    "I set long-term goals for the semester or year",
                    "I don’t set specific study goals",
                    "I set goals but rarely achieve them"
                ]
            },
            {
                question: "How do you define your study goals?",
                type: 'single-choice',
                choices: [
                    "By the number of topics or chapters to cover",
                    "By the amount of time to spend on each subject",
                    "By the grades or scores I want to achieve",

                ]
            },
            {
                question: "How often do you review or adjust your study goals?",
                type: 'single-choice',
                choices: [
                    "Daily or weekly",
                    "Monthly or at the end of each semester",
                    "Rarely, I stick to the initial goals",
                    "I don’t review or adjust my study goals"
                ]
            },
            {
                question: "What motivates you to achieve your study goals?",
                type: 'single-choice',
                choices: [
                    "Desire to improve my grades or knowledge",
                    "Rewarding myself for reaching goals",
                    "Pressure from parents or teachers",
                    "I don’t feel motivated by goals"
                ]
            },
            {
                question: "What is the biggest benefit of setting study goals?",
                type: 'single-choice',
                choices: [
                    "Better focus and direction in studying",
                    "Increased motivation to learn",
                    "Improved time management and productivity",
                    "I haven’t noticed any benefits"
                ]
            }
        ]
    },
    {
        category: "Organizing Notes",
        questions: [
            {
                question: "How do you take notes while studying?",
                type: 'single-choice',
                choices: [
                    "Handwritten notes on paper",
                    "Digital notes on a computer or tablet",
                    "Highlighting or underlining in textbooks",
                    "I don’t take notes while studying"
                ]
            },
            {
                question: "What method do you use to organize your notes?",
                type: 'single-choice',
                choices: [
                    "Color-coding or categorizing by topic",
                    "Creating outlines or mind maps",
                    "Using digital tools for note-taking",
                    "I don’t organize my notes"
                ]
            },
            {
                question: "How often do you review or revise your notes?",
                type: 'single-choice',
                choices: [
                    "After each study session",
                    "Before exams or quizzes",
                    "Rarely, I rely on memory for information",
                    "I don’t review my notes"
                ]
            },
            {
                question: "What is the biggest challenge in organizing your notes?",
                type: 'single-choice',
                choices: [
                    "Keeping notes neat and organized",
                    "Finding a note-taking method that works for me",
                    "Remembering to review notes regularly",
                    "I don’t face any challenges"
                ]
            },
            {
                question: "What has been the most effective note-taking method for you?",
                type: 'single-choice',
                choices: [
                    "Summarizing information in my own words",
                    "Creating visual aids like diagrams or charts",
                    "Using digital tools for note-taking",
                    "I haven’t found an effective method"
                ]
            }
        ]
    },
    {
        category: "Teach what you've learned",
        questions: [
            {
                question: "Do you teach others what you’ve learned?",
                type: 'single-choice',
                choices: [
                    "Yes, I explain concepts to classmates or friends",
                    "I help others understand difficult topics",
                    "I prefer to study alone",
                    "I haven’t tried teaching others"
                ]
            },
            {
                question: "How do you feel after teaching someone?",
                type: 'single-choice',
                choices: [
                    "Confident about my understanding of the topic",
                    "Satisfied to help others learn",
                    "I feel anxious about my explanation",
                    "I haven’t taught others"
                ]
            },
            {
                question: "What is the biggest benefit of teaching others?",
                type: 'single-choice',
                choices: [
                    "Solidifying my own knowledge",
                    "Improving communication and teaching skills",
                    "Helping others succeed in their studies",
                    "I don’t see any benefit in teaching others"
                ]
            },
            {
                question: "How do you approach teaching others?",
                type: 'single-choice',
                choices: [
                    "By explaining concepts in simple terms",
                    "By using examples and real-life scenarios",
                    "By answering questions and providing feedback",
                    "I haven’t taught others"
                ]
            },
            {
                question: "What challenges do you face when teaching others?",
                type: 'single-choice',
                choices: [
                    "Difficulty in simplifying complex topics",
                    "Lack of confidence in my knowledge",
                    "Managing time to teach and study",
                    "Finding someone to teach",

                ]
            }
        ]
    },
    {
        category: "Use of Flashcards",
        questions: [
            {
                question: "Do you use flashcards for studying?",
                type: 'single-choice',
                choices: [
                    "Yes, I use flashcards regularly",
                    "I use flashcards occasionally",
                    "I prefer other study methods",
                    "I haven’t tried using flashcards"
                ]
            },
            {
                question: "What type of information do you put on flashcards?",
                type: 'single-choice',
                choices: [
                    "Key terms or definitions",
                    "Equations or formulas",
                    "Concepts and explanations",
                    "I don’t use flashcards"
                ]
            },
            {
                question: "How do you review flashcards?",
                type: 'single-choice',
                choices: [
                    "Regularly to reinforce memory",
                    "Before exams or quizzes",
                    "When I have extra time to study",
                    "I don’t review flashcards"
                ]
            },
            {
                question: "What has been the biggest benefit of using flashcards?",
                type: 'single-choice',
                choices: [
                    "Improving memory retention",
                    "Quick review of key information",
                    "Organizing information for easy study",
                    "I haven’t found flashcards helpful"
                ]
            },
            {
                question: "What challenges do you face in using flashcards?",
                type: 'single-choice',
                choices: [
                    "Creating and organizing flashcards",
                    "Remembering to review them regularly",
                    "Finding the most effective way to use flashcards",
                    "I don’t face any challenges"
                ]
            }
        ]
    },
    {
        category: "Using Aromatherapy, Plants, or Music",
        questions: [
            {
                question: "What do you use to create a better study environment?",
                type: 'single-choice',
                choices: [
                    "Aromatherapy (e.g., essential oils, scented candles)",
                    "Plants to improve air and focus",
                    "Music to help with concentration",
                    "None of these"
                ]
            },
            {
                question: "What type of music do you prefer while studying?",
                type: 'single-choice',
                choices: [
                    "Classical or instrumental music",
                    "Lo-fi or ambient sounds",
                    "Pop or upbeat music",
                    "I don’t listen to music while studying."
                ]
            },
            {
                question: "Do you think plants improve your focus while studying?",
                type: 'single-choice',
                choices: [
                    "Yes, they help me concentrate better.",
                    "Sometimes, but not always.",
                    "No, I don’t notice any difference.",
                    "I haven’t tried studying with plants around."
                ]
            },
            {
                question: "What is your favorite scent for creating a study-friendly environment?",
                type: 'single-choice',
                choices: [
                    "Lavender or calming scents",
                    "Citrus or energizing scents",
                    "Mint or refreshing scents",
                    "I don’t use scents while studying."
                ]
            },
            {
                question: "Have you noticed any benefits from using scents, plants, or music while studying?",
                type: 'single-choice',
                choices: [
                    "Yes, it helps me focus better.",
                    "Sometimes, but not always.",
                    "No, it doesn’t affect my studying.",
                    "I haven’t tried it"
                ]
            }
        ]
    }
];

export default questions;
