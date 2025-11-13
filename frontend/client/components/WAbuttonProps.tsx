import { FaWhatsapp } from "react-icons/fa";

interface WhatsAppButtonProps {
    phoneNumber: string; // contoh: "6281234567890" tanpa tanda +
    size?: number; // ukuran ikon opsional
}

export default function WhatsAppButton({
    phoneNumber,
    size = 50,
}: WhatsAppButtonProps) {
    const url = `https://wa.me/${phoneNumber}`;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 bg-green-500 rounded-full p-3 shadow-lg hover:scale-110 transition-transform duration-300"
        >
            <FaWhatsapp size={size} color="white" />
        </a>
    );
}
