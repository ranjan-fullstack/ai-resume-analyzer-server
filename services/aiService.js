const ai = require("../config/gemini");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ============================= */
/* Call Gemini With Retry Logic */
/* ============================= */

async function callModel(modelName, prompt) {
  return await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });
}

async function callWithRetry(prompt, retries = 2) {
  try {
    // Primary Model (Fast + Stable)
    return await callModel("gemini-3-flash-preview", prompt);
  } catch (error) {
    if (error.status === 503 && retries > 0) {
      console.log("Primary model busy. Retrying...");
      await sleep(2000);
      return callWithRetry(prompt, retries - 1);
    }

    // Fallback Model (More Powerful)
    try {
      console.log("Switching to fallback model...");
      return await callModel("gemini-2.5-pro", prompt);
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
}

/* ============================= */
/* Resume Analysis Service */
/* ============================= */

const analyzeResume = async (resumeText, jobDescription) => {
  const prompt = `
You are an AI-powered Applicant Tracking System (ATS) used by HR recruiters.

Your task is to evaluate the candidate resume against the job description using structured weighted scoring.

SCORING CRITERIA:

1. Required Technical Skills Match (50%)
2. Relevant Years of Experience (20%)
3. Role & Domain Relevance (15%)
4. Education & Certifications (10%)
5. Soft Skills & Communication Indicators (5%)

INSTRUCTIONS:

- Identify required skills from the job description.
- Compare them with the resume.
- Calculate individual scores for each category (0–100).
- Compute final weighted matchPercentage.
- Be objective and realistic like a professional HR tool.
- Do NOT be overly generous.
- Provide structured insights.
- DO NOT change property names.
- Return ONLY valid JSON.

Return ONLY valid JSON in this exact format:

{
  "matchPercentage": number,
  "skillMatchScore": number,
  "experienceScore": number,
  "domainRelevanceScore": number,
  "educationScore": number,
  "softSkillScore": number,
  "missingCriticalSkills": [],
  "strengths": [],
  "improvementSuggestions": [],
  "hiringRecommendation": "Strong Hire" | "Moderate" | "Weak"
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

  try {
    const response = await callWithRetry(prompt);
    return response.text;
  } catch (error) {
    console.error("AI Service Failed:", error.message);
    throw new Error("AI service temporarily unavailable");
  }
};

module.exports = analyzeResume;