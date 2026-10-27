import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AuthBrand } from './auth/AuthShell';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-16">
      <AuthBrand />
      <h1 className="mt-10 font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">
        Page not found.
      </h1>
      <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-slate">
        This page does not exist or is no longer available.
      </p>
      <Link to="/dashboard" className="mt-8">
        <Button>Return to dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
