import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DatabaseError() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-red-900 mb-2">OpenSauce P.O.S.</h1>
                    <p className="text-lg text-red-700">System initialization Error</p>
                </div>

                <Card className="shadow-xl border-red-200">
                    <CardHeader className="text-center bg-red-50">
                        <CardTitle className="text-2xl text-red-900 uppercase">Database connection failed</CardTitle>
                        <CardDescription className="text-base text-red-700">
                            The application could not connect to the local database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
                            <h3 className="text-lg font-semibold text-red-900 mb-4">CONTACT SUPPORT</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-red-800 font-medium text-sm">Phone/WhatsApp:</p>
                                    <a
                                        href="https://wa.me/27847990432"
                                        className="text-red-700 hover:text-red-900 font-mono text-lg font-bold"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        (+27) 084 799 0432
                                    </a>
                                </div>
                                <div>
                                    <p className="text-red-800 font-medium text-sm">Email Support:</p>
                                    <a
                                        href="mailto:info@rt8.co.za"
                                        className="text-red-700 hover:text-red-900 font-mono block"
                                    >
                                        info@rt8.co.za
                                    </a>
                                    <a
                                        href="mailto:Ilyas@rt8.co.za"
                                        className="text-red-700 hover:text-red-900 font-mono block"
                                    >
                                        Ilyas@rt8.co.za
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <p className="text-sm text-yellow-800 leading-relaxed">
                                <strong>Technical Note:</strong> If this is a new installation, please ensure you have the required SQLite runtimes installed.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
