import { redirect } from 'next/navigation';
import SignupPage from '../page';

interface SignupWithPlanProps {
  params: {
    plan: string;
  };
}

export default function SignupWithPlan({ params }: SignupWithPlanProps) {
  const validPlans = ['free', 'grow', 'scale', 'beta'];
  const selectedPlan = params.plan.toLowerCase();

  // If invalid plan, redirect to regular signup
  if (!validPlans.includes(selectedPlan)) {
    redirect('/signup');
  }

  // Pass the plan to the SignupPage component
  return <SignupPage initialPlan={selectedPlan as 'free' | 'grow' | 'scale' | 'beta'} />;
}
