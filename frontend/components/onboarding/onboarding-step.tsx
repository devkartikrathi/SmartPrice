import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingStepProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function OnboardingStep({ title, description, children }: OnboardingStepProps) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-300">
          {description}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  );
}
