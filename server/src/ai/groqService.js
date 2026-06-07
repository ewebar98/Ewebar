import Groq from "groq-sdk";

let groqInstance;

const getGroqInstance = () => {
  if (!groqInstance && process.env.GROQ_API_KEY) {
    try {
      groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
    } catch (err) {
      console.warn("[Groq Initialize Warn] Failed to initialize Groq SDK:", err.message);
    }
  }
  return groqInstance;
};

const generateOfflineResponse = (messages) => {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const query = lastMessage.toLowerCase();

  let responseText = "";

  if (query.includes("hi") || query.includes("hello") || query.includes("hey")) {
    responseText = "Yo bro! I'm Ada, your admission guide. What course are we looking at today, or is there a school you want to check out?";
  } else if (query.includes("unilag") || query.includes("covenant") || query.includes("ui") || query.includes("oau") || query.includes("cut-off") || query.includes("score")) {
    responseText = "Universities baseline is 150-200, but competitive fields (like Law, Medicine, Engineering) at top schools like UNILAG, UI, and Covenant require a JAMB score of 240-280+. What is your score, bro?";
  } else if (query.includes("jamb") || query.includes("utme") || query.includes("waec") || query.includes("neco")) {
    responseText = "You need at least 5 O'Level credits (A1-C6) including English and Maths, plus the correct 4 JAMB subjects. Tell me your desired course and I'll lay out the exact combination, bro!";
  } else if (query.includes("computer science") || query.includes("software engineering") || query.includes("cs")) {
    responseText = "For Computer Science, aim for a JAMB score of 230+. Focus on English, Maths, Physics, and Chemistry. Top options are FUTA, UNILAG, and Covenant. What school interests you, bro?";
  } else if (query.includes("medicine") || query.includes("surgery") || query.includes("mbbs")) {
    responseText = "Medicine requires a killer JAMB score of 270+ and English, Biology, Chemistry, and Physics. UI and UNILAG are top tier. Are you currently preparing for these?";
  } else if (query.includes("law") || query.includes("llb")) {
    responseText = "For Law, Literature-in-English, English, Government, and Arts are key. Target 250+ in JAMB. UI, OAU, and UNILAG are the best options. What's your target, bro?";
  } else if (query.includes("engineering") || query.includes("mechanical") || query.includes("electrical") || query.includes("civil")) {
    responseText = "Engineering calls for English, Maths, Physics, and Chemistry. Target 230+ for top schools like FUTA, UI, and Covenant. Which branch of Engineering are you looking at, bro?";
  } else {
    responseText = "I got you! Just keep your combination correct: English, Maths, and your 3 major departmental electives. What specific admission questions do you have for me, bro?";
  }

  return {
    role: "assistant",
    content: responseText
  };
};

export const getAIExplanation = async (prompt) => {
  const groq = getGroqInstance();
  if (!groq) {
    return "Admission to top-tier higher institutions in Nigeria requires excellent O'Level credit matches (minimum of 5 credits including English and Mathematics) and an optimal JAMB UTME score aligning with course benchmarks. (Standard Offline Guide)";
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an intelligent university admission counselor for WeBAR. Provide extremely concise, direct, helpful, and professional advice (max 2-3 sentences). Do NOT output any emojis under any circumstances.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.warn("[Groq Explanation 70b Failed] Trying 8b-instant:", error.message);
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an intelligent university admission counselor for WeBAR. Provide extremely concise, direct, helpful, and professional advice (max 2-3 sentences). Do NOT output any emojis under any circumstances.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.1-8b-instant",
      });

      return chatCompletion.choices[0].message.content;
    } catch (error8b) {
      console.error("[Groq Explanation Failed] Using offline fallback:", error8b.message);
      return "Admission to top-tier higher institutions in Nigeria requires excellent O'Level credit matches (minimum of 5 credits including English and Mathematics) and an optimal JAMB UTME score aligning with course benchmarks. (Standard Offline Guide)";
    }
  }
};

export const chatWithAI = async (messages) => {
  const groq = getGroqInstance();
  if (!groq) {
    return generateOfflineResponse(messages);
  }

  const systemPrompt = 
    "You are Ada, an intelligent and extremely friendly university admission counselor for WeBAR. " +
    "IMPORTANT RULE: Keep your replies very concise, conversational, and punchy (maximum 2-3 sentences or a very short bulleted list of 2-3 items). " +
    "Never write long paragraphs or give generic walls of information. " +
    "Be direct and address exactly what is asked in a friendly tone (use terms like 'bro' naturally). " +
    "Do NOT output any emojis under any circumstances. " +
    "Always conclude with a quick, short follow-up question to keep the conversation conversational.";

  // Try the best reasoning model first: llama-3.3-70b-versatile
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      model: "llama-3.3-70b-versatile",
    });

    return {
      role: "assistant",
      content: chatCompletion.choices[0].message.content,
    };
  } catch (error70b) {
    console.warn("[Groq 70b Failed] Falling back to 8b-instant:", error70b.message);
    
    // Fall back to llama-3.1-8b-instant
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
        model: "llama-3.1-8b-instant",
      });

      return {
        role: "assistant",
        content: chatCompletion.choices[0].message.content,
      };
    } catch (error8b) {
      console.error("[Groq All API Models Failed] Using high-performance offline counselor:", error8b.message);
      return generateOfflineResponse(messages);
    }
  }
};
