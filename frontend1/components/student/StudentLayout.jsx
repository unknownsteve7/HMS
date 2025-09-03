import React from 'react';
import { Outlet } from 'react-router-dom';
import StudentHeader from '../layout/StudentHeader';
import PageWrapper from '../layout/PageWrapper';

const StudentLayout = () => {
  return (
    <div className="min-h-screen font-sans bg-base-bg flex flex-col">
      <StudentHeader />
      <main className="flex-1">
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </main>
    </div>
  );
};

export default StudentLayout;