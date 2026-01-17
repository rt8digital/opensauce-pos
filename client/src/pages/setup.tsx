import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Phone, Mail } from "lucide-react";

export default function DatabaseError() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-bold text-red-900 mb-2">OpenSauce P.O.S.</h1>
                    <p className="text-lg text-red-700 font-medium">System Database Error</p>
                </div>

                <Card className="shadow-2xl border-red-200 overflow-hidden">
                    <CardHeader className="text-center bg-red-600 text-white py-6">
                        <CardTitle className="text-2xl font-bold uppercase tracking-tight">Database Link Broken</CardTitle>
                        <CardDescription className="text-red-100 text-base mt-2">
                            Critical: The application cannot communicate with the database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-8 pb-8">
                        <div className="bg-red-50 border border-red-100 p-6 rounded-xl">
                            <h3 className="text-sm font-bold text-red-900 uppercase tracking-widest mb-4 text-center">Contact Technical Support</h3>
                            <div className="space-y-5">
                                <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                                    <div className="bg-red-50 p-2 rounded-md">
                                        <Phone className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">WhatsApp / Call</p>
                                        <a href="https://wa.me/27847990432" target="_blank" className="text-red-700 font-mono text-lg font-bold hover:underline">
                                            (+27) 084 799 0432
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                                    <div className="bg-red-50 p-2 rounded-md">
                                        <Mail className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500 font-bold uppercase">Email Support</p>
                                        <div className="flex flex-col">
                                            <a href="mailto:info@rt8.co.za" className="text-red-700 font-mono text-sm font-semibold hover:underline">info@rt8.co.za</a>
                                            <a href="mailto:Ilyas@rt8.co.za" className="text-red-700 font-mono text-sm font-semibold hover:underline">Ilyas@rt8.co.za</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                            <div className="text-amber-600 mt-1">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-amber-800 leading-relaxed italic">
                                <strong>Common Fix:</strong> This usually happens if the database file is locked by another process or if the SQLite binaries are missing. Try restarting your PC.
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <p className="text-center text-red-400 text-xs mt-6 font-medium">
                    Diagnostic Code: ERR_DB_NOT_CONNECTED_V2
                </p>
            </div>
        </div>
    );
}
