// app/api/sub-converter/clash.ts
import yaml from 'js-yaml';
import { ClashProxy } from './parsers';
import { PresetConfig, PRESETS } from './presets';

export function generateClashConfig(
  proxies: ClashProxy[],
  presetId: string = 'default',
): string {
  const preset: PresetConfig =
    PRESETS.find((p) => p.id === presetId) || PRESETS[0];
  const proxyNames = proxies.map((p) => p.name);
  const presetResult = preset.build(proxyNames);

  const config: Record<string, unknown> = {
    port: 7890,
    'socks-port': 7891,
    'allow-lan': false,
    mode: 'rule',
    'log-level': 'info',
    'external-controller': '127.0.0.1:9090',
    dns: {
      enable: true,
      'enhanced-mode': 'fake-ip',
      nameserver: [
        'https://dns.alidns.com/dns-query',
        'https://doh.pub/dns-query',
      ],
      fallback: [
        'https://1.1.1.1/dns-query',
        'https://dns.google/dns-query',
      ],
      'fallback-filter': { geoip: true, 'geoip-code': 'CN' },
    },
    proxies: proxies,
    'proxy-groups': presetResult.proxyGroups,
    rules: presetResult.rules,
  };

  if (presetResult.ruleProviders) {
    config['rule-providers'] = presetResult.ruleProviders;
  }

  return yaml.dump(config, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
  });
}
