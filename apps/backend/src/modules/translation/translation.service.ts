import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

export type SupportedLocale = 'en' | 'es' | 'it' | 'de' | 'fr';

const DEEPL_LANG: Record<SupportedLocale, string> = {
  fr: 'FR',
  en: 'EN-US',
  es: 'ES',
  it: 'IT',
  de: 'DE',
};

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(private settings: SettingsService) {}

  /** Test si la traduction auto est configurée. */
  async isEnabled(): Promise<boolean> {
    const k = await this.settings.get('deepl_api_key');
    return !!(k && k.trim());
  }

  /**
   * Traduit un texte (HTML supporté via tag_handling=html) du FR vers la locale cible.
   * Retourne null si DeepL n'est pas configuré ou en cas d'erreur API.
   */
  async translateFromFr(text: string, target: SupportedLocale, isHtml = false): Promise<string | null> {
    if (!text?.trim()) return '';
    const apiKey = (await this.settings.get('deepl_api_key'))?.trim();
    if (!apiKey) return null;
    if (target === 'fr') return text;

    // Free-tier endpoint si la clé se termine par ":fx", sinon Pro
    const endpoint = apiKey.endsWith(':fx')
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';

    try {
      // Auth par header (DeepL a déprécié l'auth form body en novembre 2025).
      // L'API JSON attend des booleans pour les flags + `text` en tableau.
      const body: Record<string, unknown> = {
        text: [text],
        source_lang: 'FR',
        target_lang: DEEPL_LANG[target],
        preserve_formatting: true,
      };
      if (isHtml) body.tag_handling = 'html';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        this.logger.warn(`DeepL ${target} ${res.status}: ${await res.text()}`);
        return null;
      }
      const data = (await res.json()) as { translations?: Array<{ text: string }> };
      return data.translations?.[0]?.text ?? null;
    } catch (e: any) {
      this.logger.warn(`DeepL ${target} error: ${e.message}`);
      return null;
    }
  }

  /**
   * Traduit un objet { title, body, ctaLabel } vers les 4 langues cibles.
   * Skip une locale si elle a déjà un override fourni (`existing`).
   */
  async autoTranslateSection(
    source: { title?: string; body?: string; ctaLabel?: string | null },
    existing?: Record<string, { title?: string; body?: string; ctaLabel?: string }> | null,
  ): Promise<Record<string, { title?: string; body?: string; ctaLabel?: string }>> {
    const targets: SupportedLocale[] = ['en', 'es', 'it', 'de'];
    const out: Record<string, { title?: string; body?: string; ctaLabel?: string }> = {};

    for (const t of targets) {
      const ex = existing?.[t] ?? {};
      const o: { title?: string; body?: string; ctaLabel?: string } = { ...ex };
      // Ne traduit que les champs manquants ; respecte les overrides admin
      if (!o.title && source.title) {
        const tr = await this.translateFromFr(source.title, t, false);
        if (tr) o.title = tr;
      }
      if (!o.body && source.body) {
        const tr = await this.translateFromFr(source.body, t, true);
        if (tr) o.body = tr;
      }
      if (!o.ctaLabel && source.ctaLabel) {
        const tr = await this.translateFromFr(source.ctaLabel, t, false);
        if (tr) o.ctaLabel = tr;
      }
      if (o.title || o.body || o.ctaLabel) out[t] = o;
    }
    return out;
  }
}
