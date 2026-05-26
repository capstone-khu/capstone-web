import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>
      <p className="mt-2 text-muted-foreground">Capstone project starter.</p>
      <div className="mt-8">
        <Link to="/" className="text-primary underline-offset-4 hover:underline">
          ← Home
        </Link>
      </div>
    </div>
  );
}
