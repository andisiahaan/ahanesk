import Link from 'next/link';
import { Logo } from '@ahanesk/ui';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink, ShieldCheck, Zap, LayoutDashboard, Globe2 } from 'lucide-react';
import { Footer } from '@/components/footer';

export const metadata: Metadata = { title: 'Home - Ahanesk Starter Kit' };

const features = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: 'Enterprise Auth',
    desc: 'Secure JWT, Google OAuth, and 2FA TOTP built-in out of the box.',
  },
  {
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
    title: 'Edge Ready',
    desc: 'Next.js App Router with React Server Components for maximum performance.',
  },
  {
    icon: <LayoutDashboard className="w-8 h-8 text-blue-500" />,
    title: 'Dedicated Admin',
    desc: 'Full CRUD admin panel running on a separate port for high security.',
  },
  {
    icon: <Globe2 className="w-8 h-8 text-emerald-500" />,
    title: 'i18n Ready',
    desc: 'Fully localized strings ready to be translated to any language globally.',
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Nav */}
      <header className="absolute top-0 w-full z-50">
        <div className="mx-auto max-w-6xl p-6 flex justify-between items-center">
          <Logo width={140} height={36} className="text-foreground" />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full font-semibold shadow-md hover:shadow-primary/25 transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[75vh] px-4 text-center pt-24">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--primary),0.1)]">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          v2.0 Starter Kit is Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto drop-shadow-sm">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-500 pb-2">
            Production-Ready
          </span>
          Full-Stack Toolkit
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          The ultimate boilerplate to launch your next big idea. 
          Powered by <strong className="text-foreground font-semibold">NestJS, Next.js, Prisma,</strong> and a scalable <strong className="text-foreground font-semibold">pnpm Monorepo</strong>.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="https://ahanesk.ahandev.com" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 gap-2">
              View Live Demo
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full font-semibold bg-background/50 backdrop-blur-md border-border hover:bg-muted transition-all duration-300 gap-2">
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group relative p-6 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
            >
              {/* Subtle gradient hover effect inside the card */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 mb-5 p-3 inline-flex rounded-2xl bg-muted/50 border border-border/50 group-hover:scale-110 transition-transform duration-500">
                {feature.icon}
              </div>
              <h3 className="relative z-10 text-xl font-bold mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
