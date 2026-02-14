const express = require('express');
const multer = require('multer');
const cors = require('cors');
const OpenAI = require("openai");
require('dotenv').config();

const app = express();

const allowedOrigins = [
    'https://scheduler-designer.vercel.app',                             // Main Domain
    'https://scheduler-designer-6dxxqd53w-jy-crnzs-projects.vercel.app', // Specific Deployment Link
    'http://localhost:5500'                                              // Local testing
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps) or those in our list
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS policy'));
        }
    }
}));

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Helper to calculate index based on dynamic column count.
 * @param {string} day 
 * @param {string} timeRange 
 * @param {number} numCols (5 for Mon-Fri, 7 for Mon-Sun)
 */
function getStrictCellIndex(day, timeRange, numCols) {
    const dayMap = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    };

    // Use .trim() to prevent accidental spacing issues from AI
    const dayIndex = dayMap[day.trim().toLowerCase()] ?? 0;

    const startTime = timeRange.split('-')[0].trim().toUpperCase();
    const hourMatch = startTime.match(/(\d+):/);
    if (!hourMatch) return (0 * numCols) + dayIndex;

    let hour = parseInt(hourMatch[1]);
    const isPM = startTime.includes('PM') && hour !== 12;
    const isAM12 = startTime.includes('AM') && hour === 12;

    const militaryHour = isPM ? hour + 12 : (isAM12 ? 0 : hour);

    let rowIndex = 0;
    if (militaryHour >= 7 && militaryHour < 9) rowIndex = 0;
    else if (militaryHour >= 9 && militaryHour < 11) rowIndex = 1;
    else if (militaryHour >= 11 && militaryHour < 13) rowIndex = 2;
    else if (militaryHour >= 13 && militaryHour < 15) rowIndex = 3;
    else if (militaryHour >= 15) rowIndex = 4;

    // Formula updated to use dynamic numCols
    return (rowIndex * numCols) + dayIndex;
}

const PORT = process.env.PORT || 3000;

app.post('/api/scan-schedule', upload.single('scheduleImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No image uploaded.');

        const base64Image = req.file.buffer.toString("base64");

        const prompt = `Extract all classes from this school schedule image.
        Return a JSON array of objects with these keys:
        - "subject": Full name of the course
        - "day": Full name of the day (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
        - "time": Full time range (e.g., "08:00AM-11:00AM")
        - "room": Room code or "TBA"

        Output ONLY raw JSON.`;

        const response = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-001",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${base64Image}` } }
                ]
            }],
            response_format: { type: "json_object" }
        });

        const rawContent = response.choices[0].message.content;
        const aiResult = JSON.parse(rawContent);
        const classes = Array.isArray(aiResult) ? aiResult : Object.values(aiResult)[0];

        // --- STEP 1: DETECT WEEKEND CLASSES ---
        const hasWeekend = classes.some(c =>
            ["saturday", "sunday"].includes(c.day.trim().toLowerCase())
        );
        const numCols = hasWeekend ? 7 : 5;

        // --- STEP 2: CALCULATE INDEXES WITH CORRECT numCols ---
        const finalSchedule = classes.map(item => ({
            ...item,
            cellIndex: getStrictCellIndex(item.day, item.time, numCols)
        }));

        console.log(`✅ Scan successful. Mode: ${numCols}-day grid.`);

        // Return both the data and the grid configuration
        res.json({
            schedule: finalSchedule,
            numCols: numCols
        });

    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Final Stable Server: http://localhost:${PORT}`));