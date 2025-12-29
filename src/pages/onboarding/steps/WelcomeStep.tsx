import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="max-w-2xl mx-auto px-6">
      <div className="min-h-screen flex flex-col items-center justify-center">
        {/* Ultra-Minimal Centered Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1.2 }}
          className="text-center space-y-16"
        >
          {/* Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-y-2"
          >
            <h1 className="text-[11px] tracking-[0.3em] uppercase text-foreground font-medium">
              Pier
            </h1>
          </motion.div>

          {/* Main Message - Maximum 2 lines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="space-y-3"
          >
            <p className="text-[15px] leading-relaxed text-foreground/70 tracking-wide font-light">
              Precision-engineered for your travel benefits
            </p>
          </motion.div>

          {/* Action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <Button
              onClick={onNext}
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 px-10 h-11 dark:bg-foreground dark:text-background"
            >
              <span className="text-[11px] tracking-[0.25em] uppercase font-medium">
                Begin
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Technical Footer - Minimal Metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="fixed bottom-12 left-0 right-0 flex justify-center"
        >
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            <span>001</span>
            <span className="mx-3">—</span>
            <span>006</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

