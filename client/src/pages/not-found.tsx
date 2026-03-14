import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="text-6xl font-bold text-muted-foreground/20 mb-4">404</div>
          <h1 className="text-xl font-semibold mb-2">Page not found</h1>
          <p className="text-muted-foreground text-sm">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
