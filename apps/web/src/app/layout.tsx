import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { MuiRegistry } from "../components/MuiRegistry";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MuiRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </MuiRegistry>
      </body>
    </html>
  );
}
