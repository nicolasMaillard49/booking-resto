// Whitelist validation est appliquée par SettingsService.updateMany.
// Le DTO accepte n'importe quel record pour rester flexible côté HTTP body.
export class UpdateSettingsDto {
  [key: string]: string | undefined;
}
