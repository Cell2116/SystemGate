

// import express from "express";
// import twilio from "twilio";

// const router = express.Router();

// const client = twilio(accountSid, authToken);

// const targetNumbers = [
//     "+6285176801010",
//     // "+6281223781524",
// ];

// router.post("/send", async (req, res) => {
//     const { message } = req.body;

//     if (!message) {
//         return res.status(400).json({ success: false, message: "Message is required" });
//     }

//     try {
//         const results = await Promise.all(
//             targetNumbers.map(async (num) => {
//                 const msg = await client.messages.create({
//                     from: "whatsapp:+14155238886", 
//                     to: `whatsapp:${num}`,          
//                     body: message,
//                 });
//                 return { number: num, status: "success", sid: msg.sid };
//             })
//         );

//         res.json({ success: true, results });
//     } catch (error) {
//         console.error("❌ Twilio Error:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// });

// export default router;
