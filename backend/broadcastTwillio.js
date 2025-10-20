import express from "express";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config(); 

const router = express.Router();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error("❌ TWILIO credentials missing in .env file!");
    process.exit(1); 
}
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const targetNumbers = [
    "+6285176801010",
    // "+6281223781524",
];

// Endpoint POST /send
router.post("/send", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: "Message is required" });
    }

    try {
        const results = await Promise.all(
            targetNumbers.map(async (num) => {
                const msg = await client.messages.create({
                    from: "whatsapp:+14155238886", // nomor Twilio WhatsApp sandbox
                    to: `whatsapp:${num}`,
                    body: message,
                });
                return { number: num, status: "success", sid: msg.sid };
            })
        );

        res.json({ success: true, results });
    } catch (error) {
        console.error("❌ Twilio Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
