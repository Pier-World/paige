import { ConciergeInput } from './ConciergeInput';
import { UpcomingEvents } from './UpcomingEvents';
import { PerksSection } from './PerksSection';
import { ExclusiveExperiences } from './ExclusiveExperiences';

export function HomePage() {
  const experienceImages = [
    'https://images.unsplash.com/photo-1513772457252-c0417654a2a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwZWxlZ2FudHxlbnwxfHx8fDE3NjQ0MTg3MTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'https://images.unsplash.com/photo-1705941077230-45abe11fe7dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXBhJTIwdmluZXlhcmQlMjBsdXh1cnl8ZW58MXx8fHwxNzY0NTI1NjMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'https://images.unsplash.com/photo-1605905898247-bb1fe36b587e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwbW9kZXJufGVufDF8fHx8MTc2NDQ1MjI3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  ];

  return (
    <main className="pt-24 pb-20">
      {/* Hero Section - Concierge Input */}
      <section className="px-6 py-16 md:py-24">
        <ConciergeInput />
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />
      </div>

      {/* Upcoming Events Section */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <UpcomingEvents />
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />
      </div>

      {/* Perks & Memberships Section */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <PerksSection />
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />
      </div>

      {/* Exclusive Experiences Section */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <ExclusiveExperiences images={experienceImages} />
        </div>
      </section>

      {/* Footer Section */}
      <footer className="px-6 py-12 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent mb-12" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h2 className="mb-2" style={{ fontSize: '20px', fontWeight: 300 }}>
                Pier
              </h2>
              <p className="text-[#6a6a6a]" style={{ fontSize: '13px', fontWeight: 300 }}>
                Your personal operating system
              </p>
            </div>

            <div className="flex flex-wrap gap-12">
              <div>
                <h4 className="text-[#a0a0a0] mb-3" style={{ fontSize: '12px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Product
                </h4>
                <div className="space-y-2">
                  <a href="#" className="block text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                    Features
                  </a>
                  <a href="#" className="block text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                    Integrations
                  </a>
                  <a href="#" className="block text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                    Pricing
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-[#a0a0a0] mb-3" style={{ fontSize: '12px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Company
                </h4>
                <div className="space-y-2">
                  <a href="#" className="block text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                    About
                  </a>
                  <a href="#" className="block text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                    Privacy
                  </a>
                  <a href="#" className="block text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                    Terms
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-[#a0a0a0] mb-3" style={{ fontSize: '12px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Support
                </h4>
                <div className="space-y-2">
                  <a href="#" className="block text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                    Help Center
                  </a>
                  <a href="#" className="block text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors" style={{ fontSize: '13px', fontWeight: 300 }}>
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1f1f1f]">
            <p className="text-[#6a6a6a] text-center" style={{ fontSize: '12px', fontWeight: 300 }}>
              © 2025 Pier. Designed for leaders who value their time.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
