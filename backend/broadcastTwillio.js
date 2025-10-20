// import express from "express";
// import twilio from "twilio";
// // import dotenv from "dotenv";

// // dotenv.config();
// const router = express.Router();

// const accountSid = 'AC7ad6d2a3c4bebd00bcfd910b17c11802';
// const authToken = 'cee7ec556d3c01d542f72559fda32bb7';
// const client = twilio(accountSid, authToken);

// router.post("/send", async (req, res) => {
//     const { message, numbers } = req.body;

//     try {
//         const results = await Promise.all(
//             numbers.map(async (num) => {
//                 const formattedNumber = num.startsWith("+") ? num : `+62${num.slice(1)}`;
//                 const msg = await client.messages.create({
//                     from: "whatsapp:+14155238886", // Twilio sandbox number
//                     to: `whatsapp:${formattedNumber}`,
//                     body: message,
//                 });
//                 return { number: formattedNumber, status: "success", sid: msg.sid };
//             })
//         );
//         res.json({ success: true, results });
//     } catch (error) {
//         console.error("❌ Twilio Error:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// });

// export default router;

import express from "express";
import twilio from "twilio";

const router = express.Router();

const accountSid = "AC7ad6d2a3c4bebd00bcfd910b17c11802";
const authToken = "cee7ec556d3c01d542f72559fda32bb7";
const client = twilio(accountSid, authToken);

const targetNumbers = [
    "+6285176801010",
    // "+6281223781524",
];

router.post("/send", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: "Message is required" });
    }

    try {
        const results = await Promise.all(
            targetNumbers.map(async (num) => {
                const msg = await client.messages.create({
                    from: "whatsapp:+14155238886", 
                    to: `whatsapp:${num}`,          
                    body: message,
                });
                return { number: num, status: "success", sid: msg.sid };
            })
        );

        res.json({ success: true, results });
    } catch (error) {
        console.error("❌ Twilio Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
