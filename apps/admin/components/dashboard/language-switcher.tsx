"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { locales, localeNames, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const router = useRouter();
  const currentLocale = useLocale();

  function handleChange(locale: string) {
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <Select value={currentLocale} onValueChange={handleChange}>
      <SelectTrigger className="w-[72px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {locale.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
