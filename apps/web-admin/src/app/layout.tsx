import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Joogo WMS/OMS',
  description: 'Warehouse Management System and Order Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <a href="/" className="text-xl font-semibold text-gray-900">Joogo WMS/OMS</a>
                <a href="/admin/items" className="text-sm text-blue-600 hover:underline">Items</a>
                <a href="/admin/items/upload" className="text-sm text-blue-600 hover:underline">CSV 업로드</a>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Tenant: Joogo Test Company
                </span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}

