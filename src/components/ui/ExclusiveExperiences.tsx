import { Sparkles, Users, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { ImageWithFallback } from './ImageWithFallback';

interface Experience {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: string;
  imageUrl?: string;
}

const defaultExperiences: Experience[] = [
  {
    id: '1',
    title: 'Private Dinner with Founders',
    description: 'An intimate evening with leading founders and investors at a Michelin-starred restaurant',
    date: 'Dec 15, 2025',
    location: 'San Francisco',
    capacity: '12 seats',
    imageUrl: 'https://images.unsplash.com/photo-1513772457252-c0417654a2a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwZWxlZ2FudHxlbnwxfHx8fDE3NjQ0MTg3MTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '2',
    title: 'Exclusive Wine Country Retreat',
    description: 'Weekend experience in Napa Valley with private tastings and chef-prepared meals',
    date: 'Jan 20-22, 2026',
    location: 'Napa Valley',
    capacity: '20 seats',
    imageUrl: 'https://images.unsplash.com/photo-1705941077230-45abe11fe7dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXBhJTIwdmluZXlhcmQlMjBsdXh1cnl8ZW58MXx8fHwxNzY0NTI1NjMxfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '3',
    title: 'Art Basel VIP Experience',
    description: 'Curated access to galleries, private viewings, and collector dinners',
    date: 'Mar 10-13, 2026',
    location: 'Miami',
    capacity: '15 seats',
    imageUrl: 'https://images.unsplash.com/photo-1605905898247-bb1fe36b587e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwbW9kZXJufGVufDF8fHx8MTc2NDQ1MjI3OHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

interface ExclusiveExperiencesProps {
  experiences?: Experience[];
}

export function ExclusiveExperiences({ experiences = defaultExperiences }: ExclusiveExperiencesProps) {
  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-accent" />
          <h3 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '-0.01em' }} className="text-text-primary">
            Exclusive Pier Experiences
          </h3>
        </div>
        <p className="text-text-secondary" style={{ fontSize: '14px', fontWeight: 300 }}>
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
            className="group rounded-2xl bg-surface border border-border hover:border-accent/40 overflow-hidden transition-all cursor-pointer"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
              {experience.imageUrl && (
                <ImageWithFallback
                  src={experience.imageUrl}
                  alt={experience.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              )}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-accent/20">
                <span className="text-accent" style={{ fontSize: '11px', fontWeight: 400 }}>
                  Members Only
                </span>
              </div>
            </div>

            <div className="p-5">
              <h4 style={{ fontSize: '18px', fontWeight: 400 }} className="text-text-primary mb-2">
                {experience.title}
              </h4>
              <p className="text-text-secondary mb-4" style={{ fontSize: '13px', fontWeight: 300, lineHeight: '1.6' }}>
                {experience.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
                  <Calendar size={14} />
                  <span>{experience.date}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
                  <MapPin size={14} />
                  <span>{experience.location}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary" style={{ fontSize: '12px', fontWeight: 300 }}>
                  <Users size={14} />
                  <span>{experience.capacity}</span>
                </div>
              </div>

              <button className="w-full px-4 py-2.5 rounded-lg bg-surface-elevated hover:bg-accent text-text-primary hover:text-background transition-all" style={{ fontSize: '13px', fontWeight: 400 }}>
                Request Invitation
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

