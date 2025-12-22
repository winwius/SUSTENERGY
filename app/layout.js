import "./globals.css";

export const metadata = {
    title: "Electrical Safety Audit",
    description: "Audit Report Generator",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
