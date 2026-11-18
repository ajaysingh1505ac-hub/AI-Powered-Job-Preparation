const { GoogleGenAI, Type } = require("@google/genai")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash"
]

async function generateWithRetry(params, maxRetries = 2) {
    let lastError
    for (const model of FALLBACK_MODELS) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await ai.models.generateContent({
                    ...params,
                    model
                })
            } catch (error) {
                lastError = error
                const isTransient = error.status === 503 || error.status === 429
                console.warn(`Model ${model} attempt ${attempt} failed (status: ${error.status || "unknown"}).`)
                if (!isTransient) throw error
                await new Promise(resolve => setTimeout(resolve, 1500 * attempt))
            }
        }
    }
    throw lastError
}

const interviewReportResponseSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The job title extracted from the job description"
        },
        matchScore: {
            type: Type.NUMBER,
            description: "A score between 0 and 100 indicating how well the candidate's profile matches the job description"
        },
        technicalQuestions: {
            type: Type.ARRAY,
            description: "5 to 8 tailored technical interview questions based on the resume and job description",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The technical question asked in the interview" },
                    intention: { type: Type.STRING, description: "The interviewer's intention behind asking this question" },
                    answer: { type: Type.STRING, description: "Detailed guidance on how to answer this question effectively" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestions: {
            type: Type.ARRAY,
            description: "4 to 6 behavioral interview questions tailored to the candidate's experience and role",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The behavioral question asked in the interview" },
                    intention: { type: Type.STRING, description: "The interviewer's intention behind asking this question" },
                    answer: { type: Type.STRING, description: "How to structure the answer (e.g. STAR method) and key points to cover" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: Type.ARRAY,
            description: "Key skills required in the job description that are missing or weak in the candidate's profile",
            items: {
                type: Type.OBJECT,
                properties: {
                    skill: { type: Type.STRING, description: "The missing or weak skill" },
                    severity: {
                        type: Type.STRING,
                        enum: ["low", "medium", "high"],
                        description: "How critical this skill gap is for the role"
                    }
                },
                required: ["skill", "severity"]
            }
        },
        preparationPlan: {
            type: Type.ARRAY,
            description: "A 5 to 7 day structured interview preparation plan",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.NUMBER, description: "Day number starting from 1" },
                    focus: { type: Type.STRING, description: "Main topic or theme for the day" },
                    tasks: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Actionable study or practice tasks for the day"
                    }
                },
                required: ["day", "focus", "tasks"]
            }
        }
    },
    required: ["title", "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan"]
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `You are an expert technical recruiter and interview coach. Analyze the candidate's resume, self-description, and the target job description to generate a comprehensive, personalized interview preparation report.

Make sure to generate:
- An accurate job title based on the job description
- A realistic matchScore (0-100)
- At least 5 tailored technicalQuestions grounded in the candidate's actual resume projects/skills and the job's tech stack
- At least 4 behavioralQuestions
- Specific skillGaps with severity ("low", "medium", or "high")
- A multi-day preparationPlan (Days 1 to 5+)

Candidate Resume:
${resume || "Not provided"}

Candidate Self Description:
${selfDescription || "Not provided"}

Target Job Description:
${jobDescription}`

    const response = await generateWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportResponseSchema,
        }
    })

    const parsed = JSON.parse(response.text)
    console.log("AI Generated Report Keys & Counts:", {
        title: parsed.title,
        matchScore: parsed.matchScore,
        techCount: parsed.technicalQuestions?.length,
        behavCount: parsed.behavioralQuestions?.length
    })
    return parsed
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()
    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfResponseSchema = {
        type: Type.OBJECT,
        properties: {
            html: {
                type: Type.STRING,
                description: "Complete, well-formatted HTML content of the tailored resume ready for PDF rendering"
            }
        },
        required: ["html"]
    }

    const prompt = `Generate a tailored, ATS-friendly resume in clean HTML/CSS for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Return a JSON object with a single field "html" containing a complete HTML document styled cleanly for a 1-2 page A4 resume. Make it sound natural and human-written.`

    const response = await generateWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: resumePdfResponseSchema,
        }
    })

    const jsonContent = JSON.parse(response.text)
    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf }

// const { GoogleGenAI } = require("@google/genai")
// const { z } = require("zod")
// const { zodToJsonSchema } = require("zod-to-json-schema")
// const puppeteer = require("puppeteer")

// const ai = new GoogleGenAI({
//     apiKey: process.env.GOOGLE_GENAI_API_KEY
// })


// const interviewReportSchema = z.object({
//     matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
//     technicalQuestions: z.array(z.object({
//         question: z.string().describe("The technical question can be asked in the interview"),
//         intention: z.string().describe("The intention of interviewer behind asking this question"),
//         answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
//     })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
//     behavioralQuestions: z.array(z.object({
//         question: z.string().describe("The technical question can be asked in the interview"),
//         intention: z.string().describe("The intention of interviewer behind asking this question"),
//         answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
//     })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
//     skillGaps: z.array(z.object({
//         skill: z.string().describe("The skill which the candidate is lacking"),
//         severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
//     })).describe("List of skill gaps in the candidate's profile along with their severity"),
//     preparationPlan: z.array(z.object({
//         day: z.number().describe("The day number in the preparation plan, starting from 1"),
//         focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
//         tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
//     })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
//     title: z.string().describe("The title of the job for which the interview report is generated"),
// })

// async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


//     const prompt = `Generate an interview report for a candidate with the following details:
//                         Resume: ${resume}
//                         Self Description: ${selfDescription}
//                         Job Description: ${jobDescription}
// `

//     const response = await ai.models.generateContent({
//         model: "gemini-3-flash-preview",
//         contents: prompt,
//         config: {
//             responseMimeType: "application/json",
//             responseSchema: zodToJsonSchema(interviewReportSchema),
//         }
//     })

//     return JSON.parse(response.text)


// }



// async function generatePdfFromHtml(htmlContent) {
//     const browser = await puppeteer.launch()
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: "networkidle0" })

//     const pdfBuffer = await page.pdf({
//         format: "A4", margin: {
//             top: "20mm",
//             bottom: "20mm",
//             left: "15mm",
//             right: "15mm"
//         }
//     })

//     await browser.close()

//     return pdfBuffer
// }

// async function generateResumePdf({ resume, selfDescription, jobDescription }) {

//     const resumePdfSchema = z.object({
//         html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
//     })

//     const prompt = `Generate resume for a candidate with the following details:
//                         Resume: ${resume}
//                         Self Description: ${selfDescription}
//                         Job Description: ${jobDescription}

//                         the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
//                         The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
//                         The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
//                         you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
//                         The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
//                         The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
//                     `

//     const response = await ai.models.generateContent({
//         model: "gemini-3-flash-preview",
//         contents: prompt,
//         config: {
//             responseMimeType: "application/json",
//             responseSchema: zodToJsonSchema(resumePdfSchema),
//         }
//     })


//     const jsonContent = JSON.parse(response.text)

//     const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

//     return pdfBuffer

// }

// module.exports = { generateInterviewReport, generateResumePdf }