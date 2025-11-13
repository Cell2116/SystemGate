import { Headset } from "lucide-react";
import FlipBookCard from "@/components/FlipBookCard";
import Logo from "../../dist/server/LogoIT2.jpg";

export default function Contact() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
            {/* === Header Section === */}
            <div className="max-w-2xl text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                    Contact Support
                    <Headset className="h-7 w-7 text-blue-800" />
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                    Our support team is here to help. If you have any question, technical
                    issues, or feedback, please reach out to us using the number below.
                    We'll get back to you as soon as possible.
                </p>
            </div>

            {/* === FlipBook Card Section === */}
            <div className="flex flex-col items-center gap-4">
                <FlipBookCard
                    companyName="PT Alkindo Naratama TBK"
                    appsName="Gateway System"
                    logoUrl={Logo}
                    contactPerson="Maksudi Indra Rukmana - 6282258955636"
                    complaintLink="https://pengaduan.alkindo.co.id"
                    whatsappNumber="6282258955636"
                />

                {/* === Footer Info === */}
                <div className="w-80 bg-blue-100 border font-bold border-blue-300 rounded-lg shadow-sm px-4 py-2 flex justify-between text-xs text-gray-600">
                    <span>Marcello - Team IT </span>
                    <span>Copyright@2025</span>
                </div>
            </div>
        </div>
    );
}
