import React from 'react';
import Card from '../components/ui/Card';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="text-center">
        <h1 className="text-6xl font-bold text-primary-purple">404</h1>
        <h2 className="text-2xl font-semibold text-text-dark mt-4">Page Not Found</h2>
        <p className="text-text-medium mt-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Go to Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;