import AppLayout from '@/layouts/AppLayout';
import DeveloperPortfolio from '@/components/portfolio/DeveloperPortfolio';
export default function Home() {
  return (
    <AppLayout title="Home">
      <DeveloperPortfolio />
    </AppLayout>
  );
}
