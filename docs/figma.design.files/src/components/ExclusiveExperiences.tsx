import { Sparkles, Users, MapPin, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Experience {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: string;
  imageQuery: string;
}

const experiences: Experience[] = [
  {
    id: '1',
    title: 'Private Dinner with Founders',
    description: 'An intimate evening with leading founders and investors at a Michelin-starred restaurant',
    date: 'Dec 15, 2025',
    location: 'San Francisco',
    capacity: '12 seats',
    imageQuery: 'fine dining elegant',
  },
  {
    id: '2',
    title: 'Exclusive Wine Country Retreat',
    description: 'Weekend experience in Napa Valley with private tastings and chef-prepared meals',
    date: 'Jan 20-22, 2026',
    location: 'Napa Valley',
    capacity: '20 seats',
    imageQuery: 'napa vineyard luxury',
  },
  {
    id: '3',
    title: 'Art Basel VIP Experience',
    description: 'Curated access to galleries, private viewings, and collector dinners',
    date: 'Mar 10-13, 2026',
    location: 'Miami',
    capacity: '15 seats',
    imageQuery: 'art gallery modern',
  },
];

export function ExclusiveExperiences({ images }: { images: string[] }) {
  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-[#c9b896]" />
          <h3 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-[#e8e8e8]">
            Exclusive Pier Experiences
          </h3>
        </div>
        <p className="text-[#a0a0a0]" style={{ fontSize: '14px', fontWeight: 300 }}>
          Curated events and opportunities for our members
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {experiences.map((experience, index) => (
          <motion.div
            key={experience.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            whileHover={{ y: -8 }}
            className="group rounded-2xl bg-[#141414] border border-[#2a2a2a] hover:border-[#c9b896]/40 overflow-hidden transition-all cursor-pointer"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
              {images[index] && (
                <ImageWithFallback
                  src={images[index]}
                  alt={experience.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              )}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#0a0a0a]/80 backdrop-blur-sm border border-[#c9b896]/20">
                <span className="text-[#c9b896]" style={{ fontSize: '11px', fontWeight: 400 }}>
                  Members Only
                </span>
              </div>
            </div>

            <div className="p-5">
              <h4 style={{ fontSize: '18px', fontWeight: 400 }} className="text-[#e8e8e8] mb-2">
                {experience.title}
              </h4>
              <p className="text-[#a0a0a0] mb-4" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                {experience.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[#a0a0a0]" style={{ fontSize: '12px', fontWeight: 300 }}>
                  <Calendar size={14} />
                  <span>{experience.date}</span>
                </div>
                <div className="flex items-center gap-2 text-[#a0a0a0]" style={{ fontSize: '12px', fontWeight: 300 }}>
                  <MapPin size={14} />
                  <span>{experience.location}</span>
                </div>
                <div className="flex items-center gap-2 text-[#a0a0a0]" style={{ fontSize: '12px', fontWeight: 300 }}>
                  <Users size={14} />
                  <span>{experience.capacity}</span>
                </div>
              </div>

              <button className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a1a] hover:bg-[#c9b896] text-[#e8e8e8] hover:text-[#0a0a0a] transition-all" style={{ fontSize: '13px', fontWeight: 400 }}>
                Request Invitation
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
