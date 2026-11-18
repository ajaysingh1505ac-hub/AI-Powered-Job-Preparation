const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        console.log("1. Starting interview report generation...")

        let resumeText = ""
        if (req.file && req.file.buffer) {
            const parser = new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))
            const resumeContent = await parser.getText()
            resumeText = resumeContent.text || ""
        }

        const { selfDescription, jobDescription } = req.body

        if (!jobDescription || (!resumeText && !selfDescription)) {
            return res.status(400).json({
                message: "Job description and either a resume or self-description are required."
            })
        }

        console.log("2. PDF parsed successfully. Calling Gemini AI...")

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        console.log("3. Gemini AI response received. Saving to MongoDB...")

        const interviewReport = await interviewReportModel.create({
            ...interViewReportByAi,
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            title: interViewReportByAi.title?.trim() || interViewReportByAi.jobTitle?.trim() || "Target Role Interview Plan"
        })

        console.log("4. Report saved successfully:", interviewReport._id)

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Error in generateInterViewReportController:", error)
        return res.status(500).json({
            message: error.message || "Failed to generate interview report."
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Error in getInterviewReportByIdController:", error)
        return res.status(500).json({
            message: error.message || "Failed to fetch interview report."
        })
    }
}

/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (error) {
        console.error("Error in getAllInterviewReportsController:", error)
        return res.status(500).json({
            message: error.message || "Failed to fetch interview reports."
        })
    }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        return res.send(pdfBuffer)
    } catch (error) {
        console.error("Error in generateResumePdfController:", error)
        return res.status(500).json({
            message: error.message || "Failed to generate resume PDF."
        })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
}

// const pdfParse = require("pdf-parse")
// const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
// const interviewReportModel = require("../models/interviewReport.model")




// /**
//  * @description Controller to generate interview report based on user self description, resume and job description.
//  */
// async function generateInterViewReportController(req, res) {

//     const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
//     const { selfDescription, jobDescription } = req.body

//     const interViewReportByAi = await generateInterviewReport({
//         resume: resumeContent.text,
//         selfDescription,
//         jobDescription
//     })

//     const interviewReport = await interviewReportModel.create({
//     ...interViewReportByAi,
//     user: req.user.id,
//     resume: resumeContent.text,
//     selfDescription,
//     jobDescription,
//     title: interViewReportByAi.title?.trim() || interViewReportByAi.jobTitle?.trim() || "Target Role Interview Plan"
// });

//     // const interviewReport = await interviewReportModel.create({
//     //     user: req.user.id,
//     //     resume: resumeContent.text,
//     //     selfDescription,
//     //     jobDescription,
//     //     ...interViewReportByAi
//     // })

//     res.status(201).json({
//         message: "Interview report generated successfully.",
//         interviewReport
//     })

// }

// /**
//  * @description Controller to get interview report by interviewId.
//  */
// async function getInterviewReportByIdController(req, res) {

//     const { interviewId } = req.params

//     const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

//     if (!interviewReport) {
//         return res.status(404).json({
//             message: "Interview report not found."
//         })
//     }

//     res.status(200).json({
//         message: "Interview report fetched successfully.",
//         interviewReport
//     })
// }


// /** 
//  * @description Controller to get all interview reports of logged in user.
//  */
// async function getAllInterviewReportsController(req, res) {
//     const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

//     res.status(200).json({
//         message: "Interview reports fetched successfully.",
//         interviewReports
//     })
// }


// /**
//  * @description Controller to generate resume PDF based on user self description, resume and job description.
//  */
// async function generateResumePdfController(req, res) {
//     const { interviewReportId } = req.params

//     const interviewReport = await interviewReportModel.findById(interviewReportId)

//     if (!interviewReport) {
//         return res.status(404).json({
//             message: "Interview report not found."
//         })
//     }

//     const { resume, jobDescription, selfDescription } = interviewReport

//     const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

//     res.set({
//         "Content-Type": "application/pdf",
//         "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
//     })

//     res.send(pdfBuffer)
// }

// module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }