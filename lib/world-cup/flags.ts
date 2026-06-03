// FIFA / IOC 3-letter codes → ISO 3166-1 alpha-2 (lowercase) used by flagcdn.com.
// flagcdn serves rectangular flags (FIFA's own CDN only has square crops).
// GB nations use flagcdn's gb-eng / gb-sct / gb-wls / gb-nir subdivisions.
// Extend this map for a different tournament's teams; unmapped codes fall back
// to a neutral badge in the Flag component.
export const FIFA_TO_ISO2: Record<string, string> = {
  ALG: 'dz', // Algeria
  ARG: 'ar',
  AUS: 'au',
  AUT: 'at',
  BEL: 'be',
  BIH: 'ba', // Bosnia & Herzegovina
  BRA: 'br',
  CAN: 'ca',
  CIV: 'ci', // Côte d'Ivoire
  COD: 'cd', // DR Congo
  COL: 'co',
  CPV: 'cv', // Cape Verde
  CRO: 'hr',
  CUW: 'cw', // Curaçao
  CZE: 'cz',
  ECU: 'ec',
  EGY: 'eg',
  ENG: 'gb-eng',
  ESP: 'es',
  FRA: 'fr',
  GER: 'de',
  GHA: 'gh',
  HAI: 'ht',
  IRN: 'ir',
  IRQ: 'iq',
  ITA: 'it',
  JOR: 'jo',
  JPN: 'jp',
  KOR: 'kr', // South Korea
  KSA: 'sa', // Saudi Arabia
  MAR: 'ma',
  MEX: 'mx',
  NED: 'nl', // Netherlands
  NGA: 'ng',
  NIR: 'gb-nir',
  NOR: 'no',
  NZL: 'nz',
  PAN: 'pa',
  PAR: 'py',
  POR: 'pt',
  QAT: 'qa',
  RSA: 'za', // South Africa
  SCO: 'gb-sct',
  SEN: 'sn',
  SUI: 'ch', // Switzerland
  SWE: 'se',
  TUN: 'tn',
  TUR: 'tr',
  URU: 'uy',
  USA: 'us',
  UZB: 'uz',
  WAL: 'gb-wls',
}

// Rectangular flag URL for a team code, or null when the slot is undecided /
// the code isn't mapped (caller renders a neutral placeholder).
export function flagUrl(code: string | null, width: 40 | 80 | 160 | 320 = 160): string | null {
  if (!code) return null
  const iso = FIFA_TO_ISO2[code.toUpperCase()]
  if (!iso) return null
  return `https://flagcdn.com/w${width}/${iso}.png`
}
