import React, { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import "./FlipBookCard.css";

interface FlipBookCardProps {
    companyName: string;
    appsName: string;
    logoUrl: string;
    contactPerson: string;
    complaintLink: string;
    whatsappNumber?: string; // opsional, supaya fleksibel
}

const FlipBookCard: React.FC<FlipBookCardProps> = ({
    companyName,
    appsName,
    logoUrl,
    contactPerson,
    complaintLink,
    whatsappNumber,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative w-80 h-[50vh] [perspective:1000px] cursor-pointer">
            <div
                className={`relative w-full h-full duration-700 transform-style-preserve-3d ${isOpen ? "rotate-y-180" : ""
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Front Page */}
                <div className="absolute inset-0 bg-white border rounded-2xl shadow-xl flex flex-col items-center justify-between backface-hidden py-4">
                    {/* Bagian atas */}
                    <div className="flex flex-col items-center">
                        <img src={logoUrl} alt="Company Logo" className="w-[17vw] h-[30vh] mb-3" />
                        <h2 className="text-lg font-bold text-gray-800">{appsName}</h2>
                        <p className="text-blue-500 mt-1 text-sm">(klik untuk membuka)</p>
                    </div>

                    {/* Bagian bawah */}
                    <h2 className="text-sm opacity-50 font-semibold text-gray-800 mb-2">
                        {companyName}
                    </h2>
                </div>


                {/* Back Page */}
                <div className="absolute inset-0 bg-gray-900 text-white border rounded-2xl shadow-xl px-6 py-5 rotate-y-180 backface-hidden flex flex-col justify-center items-center gap-3">
                    <h3 className="text-xl font-bold">Contact Person</h3>
                    <p className="text-sm">{contactPerson}</p>

                    {whatsappNumber && (
                        <a
                            href={`https://wa.me/${whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-green-500 hover:text-green-400 text-4xl transition-transform hover:scale-110"
                        >
                            <FaWhatsapp />
                        </a>
                    )}

                    {/* Link Pengaduan */}
                    <a
                        href={complaintLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition"
                    >
                        Link Pengaduan
                    </a>

                    {/* Tutup halaman */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                        className="mt-2 text-xs underline opacity-70 hover:opacity-100"
                    >
                        Tutup Halaman
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlipBookCard;
