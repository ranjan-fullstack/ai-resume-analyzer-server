const extractTextFromPDF = require("../utils/pdfParser");
const analyzeResume = require("../services/aiService");

exports.uploadResume = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const resumeText = await extractTextFromPDF(file.buffer);

    res.json({
      message: "File uploaded successfully",
      resumeText,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};

exports.analyzeResume = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ message: "Missing data" });
    }

    const result = await analyzeResume(resumeText, jobDescription);

    res.json({ result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Analysis failed" });
  }
};