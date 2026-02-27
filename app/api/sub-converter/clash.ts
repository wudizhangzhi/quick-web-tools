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
    'allow-lan': true,
    mode: 'Rule',
    'log-level': 'info',
    'external-controller': ':9090',
    dns: {
      enable: true,
      nameserver: ['119.29.29.29', '223.5.5.5'],
      fallback: [
        '8.8.8.8',
        '8.8.4.4',
        '1.1.1.1',
        'tls://1.0.0.1:853',
        'tls://dns.google:853',
      ],
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
