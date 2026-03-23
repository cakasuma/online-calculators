import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="text-6xl font-bold text-muted-foreground/20 mb-4">404</div>
          <h1 className="text-xl font-semibold mb-2">{t("notFound.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("notFound.desc")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
