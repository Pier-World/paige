import React from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="container-custom py-20 text-center">
        <h1 className="text-6xl font-display font-bold mb-4">404</h1>
        <h2 className="text-3xl font-display mb-6">Page Not Found</h2>
        <p className="text-primary-600 max-w-md mx-auto mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to="/dashboard">
          <Button className="inline-flex items-center">
            <ArrowLeft size={16} className="mr-2" />
            Return to Home
          </Button>
        </Link>
      </div>
    </PageLayout>
  );
};

export default NotFoundPage;