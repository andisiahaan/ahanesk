import { PublicLayout } from '@/components/layouts/public-layout';
import { BlogNavbar } from './_components/blog-navbar';
import { BlogSidebar } from './_components/blog-sidebar';
import { Footer } from '@/components/footer';

export default function BlogLayoutWrapper({ children }: { children: React.ReactNode }) {
  // We don't use the standard PublicLayout header for the blog, so we can either
  // wrap it and hide the header, or just build a standalone layout.
  // Actually, PublicLayout includes the main Navbar. If we want a separate Blog Navbar,
  // we could just render both, or only render the Blog Navbar. Let's assume the user
  // wants a completely custom layout for the blog as requested ("Layout sendiri").

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <BlogNavbar />
      
      <main className="flex-1 w-full py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
          
          {/* Sidebar Area */}
          <aside className="w-full lg:w-80 shrink-0">
            <BlogSidebar />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
