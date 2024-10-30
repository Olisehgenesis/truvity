import RelocationJourney from './components/RelocationJourney';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Relocation Journey</h1>
        <RelocationJourney />
      </div>
    </main>
  );
}