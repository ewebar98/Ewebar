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
    responseText = "[OFFLINE] Yo bro! I'm Ada. I'm currently running on limited local logic. What course are we looking at today?";
  } else if (query.includes("unilag") || query.includes("covenant") || query.includes("ui") || query.includes("oau") || query.includes("cut-off") || query.includes("score")) {
    responseText = "[OFFLINE] Baseline is 150-200, but top schools like UNILAG/UI need 250+. What did you score?";
  } else if (query.includes("jamb") || query.includes("utme") || query.includes("waec") || query.includes("neco")) {
    responseText = "[OFFLINE] You need 5 O'Level credits including English and Maths. Tell me your course for the combination!";
  } else if (query.includes("computer science") || query.includes("software engineering") || query.includes("cs")) {
    responseText = "[OFFLINE] CS needs 230+ in JAMB. Focus on English, Maths, Physics, and Chemistry.";
  } else if (query.includes("medicine") || query.includes("surgery") || query.includes("mbbs")) {
    responseText = "[OFFLINE] Medicine needs 270+ and Bio/Chem/Phys. It is very competitive!";
  } else if (query.includes("law") || query.includes("llb")) {
    responseText = "[OFFLINE] Law needs Literature and Government. Target 250+.";
  } else if (query.includes("engineering") || query.includes("mechanical") || query.includes("electrical") || query.includes("civil")) {
    responseText = "[OFFLINE] Engineering needs Maths/Phys/Chem and a target of 230+.";
  } else {
    responseText = "[OFFLINE] Keep your combination correct (Eng/Maths + 3 electives). Any other questions?";
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
