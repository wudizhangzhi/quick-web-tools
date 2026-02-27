// app/api/sub-converter/presets.ts

import { ClashProxy } from './parsers';

/* ------------------------------------------------------------------ */
/*  Advanced Options                                                   */
/* ------------------------------------------------------------------ */

export interface AdvancedOptions {
  includeRegex?: string;
  excludeRegex?: string;
  addEmoji?: boolean;
  udp?: boolean;
  skipCertVerify?: boolean;
  sort?: boolean;
  renameRegex?: string;
  renameReplace?: string;
}

/* ------------------------------------------------------------------ */
/*  Emoji Map                                                          */
/* ------------------------------------------------------------------ */

export const EMOJI_MAP: [RegExp, string][] = [
  [/美国|US|United\s*States/i, '\u{1F1FA}\u{1F1F8}'],
  [/香港|HK|Hong\s*Kong/i, '\u{1F1ED}\u{1F1F0}'],
  [/台湾|TW|Taiwan/i, '\u{1F1F9}\u{1F1FC}'],
  [/日本|JP|Japan/i, '\u{1F1EF}\u{1F1F5}'],
  [/韩国|KR|Korea/i, '\u{1F1F0}\u{1F1F7}'],
  [/新加坡|SG|Singapore/i, '\u{1F1F8}\u{1F1EC}'],
  [/德国|DE|Germany/i, '\u{1F1E9}\u{1F1EA}'],
  [/英国|UK|United\s*Kingdom|Britain/i, '\u{1F1EC}\u{1F1E7}'],
  [/法国|FR|France/i, '\u{1F1EB}\u{1F1F7}'],
  [/加拿大|CA|Canada/i, '\u{1F1E8}\u{1F1E6}'],
  [/澳大利亚|AU|Australia/i, '\u{1F1E6}\u{1F1FA}'],
  [/印度|IN|India/i, '\u{1F1EE}\u{1F1F3}'],
  [/俄罗斯|RU|Russia/i, '\u{1F1F7}\u{1F1FA}'],
  [/土耳其|TR|Turkey|Türkiye/i, '\u{1F1F9}\u{1F1F7}'],
  [/巴西|BR|Brazil/i, '\u{1F1E7}\u{1F1F7}'],
  [/荷兰|NL|Netherlands/i, '\u{1F1F3}\u{1F1F1}'],
  [/阿根廷|AR|Argentina/i, '\u{1F1E6}\u{1F1F7}'],
];

/* ------------------------------------------------------------------ */
/*  Apply Advanced Options                                             */
/* ------------------------------------------------------------------ */

export function applyAdvancedOptions(
  proxies: ClashProxy[],
  opts: AdvancedOptions,
): ClashProxy[] {
  let result = [...proxies];

  // Include filter
  if (opts.includeRegex) {
    const re = new RegExp(opts.includeRegex, 'i');
    result = result.filter((p) => re.test(p.name));
  }

  // Exclude filter
  if (opts.excludeRegex) {
    const re = new RegExp(opts.excludeRegex, 'i');
    result = result.filter((p) => !re.test(p.name));
  }

  // Rename
  if (opts.renameRegex) {
    const re = new RegExp(opts.renameRegex, 'g');
    const replacement = opts.renameReplace ?? '';
    result = result.map((p) => ({
      ...p,
      name: p.name.replace(re, replacement),
    }));
  }

  // Emoji
  if (opts.addEmoji) {
    result = result.map((p) => {
      for (const [pattern, emoji] of EMOJI_MAP) {
        if (pattern.test(p.name)) {
          // Avoid duplicating emoji if already present
          if (!p.name.startsWith(emoji)) {
            return { ...p, name: `${emoji} ${p.name}` };
          }
          return p;
        }
      }
      return p;
    });
  }

  // Sort by name
  if (opts.sort) {
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  // UDP
  if (opts.udp !== undefined) {
    result = result.map((p) => ({ ...p, udp: opts.udp }));
  }

  // Skip cert verify
  if (opts.skipCertVerify !== undefined) {
    result = result.map((p) => ({
      ...p,
      'skip-cert-verify': opts.skipCertVerify,
    }));
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  ACL4SSR Rule-Provider Helper                                       */
/* ------------------------------------------------------------------ */

const ACL4SSR_BASE =
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Providers';

function acl4ssrProvider(name: string) {
  return {
    type: 'http',
    behavior: 'classical',
    url: `${ACL4SSR_BASE}/${name}.yaml`,
    path: `./ruleset/${name}.yaml`,
    interval: 86400,
  };
}

/* ------------------------------------------------------------------ */
/*  Preset Config                                                      */
/* ------------------------------------------------------------------ */

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  build: (proxyNames: string[]) => {
    proxyGroups: Record<string, unknown>[];
    rules: string[];
    ruleProviders?: Record<string, unknown>;
  };
}

/* ------------------------------------------------------------------ */
/*  Presets                                                             */
/* ------------------------------------------------------------------ */

export const PRESETS: PresetConfig[] = [
  /* ---------- default ---------- */
  {
    id: 'default',
    name: '默认',
    description: '节点选择 + 自动选择，最简单的分流配置',
    build: (proxyNames) => ({
      proxyGroups: [
        {
          name: '\u{1F680} 节点选择',
          type: 'select',
          proxies: ['\u{267B}\u{FE0F} 自动选择', ...proxyNames],
        },
        {
          name: '\u{267B}\u{FE0F} 自动选择',
          type: 'url-test',
          proxies: [...proxyNames],
          url: 'http://www.gstatic.com/generate_204',
          interval: 300,
          tolerance: 50,
        },
      ],
      rules: ['MATCH,\u{1F680} 节点选择'],
    }),
  },

  /* ---------- auto ---------- */
  {
    id: 'auto',
    name: '自动测速',
    description: '仅自动选择延迟最低的节点',
    build: (proxyNames) => ({
      proxyGroups: [
        {
          name: '\u{1F680} 节点选择',
          type: 'url-test',
          proxies: [...proxyNames],
          url: 'http://www.gstatic.com/generate_204',
          interval: 300,
          tolerance: 50,
        },
      ],
      rules: ['MATCH,\u{1F680} 节点选择'],
    }),
  },

  /* ---------- acl4ssr-lite ---------- */
  {
    id: 'acl4ssr-lite',
    name: 'ACL4SSR 精简版',
    description: '直连 + 广告拦截 + 代理，适合日常使用',
    build: (proxyNames) => ({
      proxyGroups: [
        {
          name: '\u{1F680} 节点选择',
          type: 'select',
          proxies: ['\u{267B}\u{FE0F} 自动选择', ...proxyNames],
        },
        {
          name: '\u{267B}\u{FE0F} 自动选择',
          type: 'url-test',
          proxies: [...proxyNames],
          url: 'http://www.gstatic.com/generate_204',
          interval: 300,
          tolerance: 50,
        },
        {
          name: '\u{1F3AF} 全球直连',
          type: 'select',
          proxies: ['DIRECT'],
        },
        {
          name: '\u{1F6D1} 广告拦截',
          type: 'select',
          proxies: ['REJECT', 'DIRECT'],
        },
        {
          name: '\u{1F41F} 漏网之鱼',
          type: 'select',
          proxies: ['\u{1F680} 节点选择', 'DIRECT'],
        },
      ],
      ruleProviders: {
        BanAD: acl4ssrProvider('BanAD'),
        BanProgramAD: acl4ssrProvider('BanProgramAD'),
        ChinaDomain: acl4ssrProvider('ChinaDomain'),
        ProxyLite: acl4ssrProvider('ProxyLite'),
      },
      rules: [
        'RULE-SET,BanAD,\u{1F6D1} 广告拦截',
        'RULE-SET,BanProgramAD,\u{1F6D1} 广告拦截',
        'RULE-SET,ChinaDomain,\u{1F3AF} 全球直连',
        'RULE-SET,ProxyLite,\u{1F680} 节点选择',
        'MATCH,\u{1F41F} 漏网之鱼',
      ],
    }),
  },

  /* ---------- acl4ssr-full ---------- */
  {
    id: 'acl4ssr-full',
    name: 'ACL4SSR 全分组版',
    description: '完整的媒体 / 服务分流规则',
    build: (proxyNames) => ({
      proxyGroups: [
        {
          name: '\u{1F680} 节点选择',
          type: 'select',
          proxies: ['\u{267B}\u{FE0F} 自动选择', ...proxyNames],
        },
        {
          name: '\u{267B}\u{FE0F} 自动选择',
          type: 'url-test',
          proxies: [...proxyNames],
          url: 'http://www.gstatic.com/generate_204',
          interval: 300,
          tolerance: 50,
        },
        {
          name: '\u{1F4F2} 电报消息',
          type: 'select',
          proxies: ['\u{1F680} 节点选择', ...proxyNames],
        },
        {
          name: '\u{1F4F9} 油管视频',
          type: 'select',
          proxies: ['\u{1F680} 节点选择', ...proxyNames],
        },
        {
          name: '\u{1F3A5} 奈飞视频',
          type: 'select',
          proxies: ['\u{1F680} 节点选择', ...proxyNames],
        },
        {
          name: '\u{1F34E} 苹果服务',
          type: 'select',
          proxies: ['DIRECT', '\u{1F680} 节点选择'],
        },
        {
          name: '\u{24C2}\u{FE0F} 微软服务',
          type: 'select',
          proxies: ['DIRECT', '\u{1F680} 节点选择'],
        },
        {
          name: '\u{1F30D} 国外媒体',
          type: 'select',
          proxies: ['\u{1F680} 节点选择', ...proxyNames],
        },
        {
          name: '\u{1F3AF} 全球直连',
          type: 'select',
          proxies: ['DIRECT'],
        },
        {
          name: '\u{1F6D1} 广告拦截',
          type: 'select',
          proxies: ['REJECT', 'DIRECT'],
        },
        {
          name: '\u{1F41F} 漏网之鱼',
          type: 'select',
          proxies: ['\u{1F680} 节点选择', 'DIRECT'],
        },
      ],
      ruleProviders: {
        BanAD: acl4ssrProvider('BanAD'),
        BanProgramAD: acl4ssrProvider('BanProgramAD'),
        Google: acl4ssrProvider('Ruleset/Google'),
        YouTube: acl4ssrProvider('Ruleset/YouTube'),
        Netflix: acl4ssrProvider('Ruleset/Netflix'),
        Telegram: acl4ssrProvider('Ruleset/Telegram'),
        Microsoft: acl4ssrProvider('Ruleset/Microsoft'),
        Apple: acl4ssrProvider('Ruleset/Apple'),
        ProxyMedia: acl4ssrProvider('ProxyMedia'),
        ChinaDomain: acl4ssrProvider('ChinaDomain'),
        ProxyLite: acl4ssrProvider('ProxyLite'),
      },
      rules: [
        'RULE-SET,BanAD,\u{1F6D1} 广告拦截',
        'RULE-SET,BanProgramAD,\u{1F6D1} 广告拦截',
        'RULE-SET,Google,\u{1F680} 节点选择',
        'RULE-SET,YouTube,\u{1F4F9} 油管视频',
        'RULE-SET,Netflix,\u{1F3A5} 奈飞视频',
        'RULE-SET,Telegram,\u{1F4F2} 电报消息',
        'RULE-SET,Microsoft,\u{24C2}\u{FE0F} 微软服务',
        'RULE-SET,Apple,\u{1F34E} 苹果服务',
        'RULE-SET,ProxyMedia,\u{1F30D} 国外媒体',
        'RULE-SET,ChinaDomain,\u{1F3AF} 全球直连',
        'RULE-SET,ProxyLite,\u{1F680} 节点选择',
        'MATCH,\u{1F41F} 漏网之鱼',
      ],
    }),
  },

  /* ---------- adblock ---------- */
  {
    id: 'adblock',
    name: '广告拦截增强版',
    description: '在精简版基础上增加 EasyList / EasyPrivacy 规则',
    build: (proxyNames) => ({
      proxyGroups: [
        {
          name: '\u{1F680} 节点选择',
          type: 'select',
          proxies: ['\u{267B}\u{FE0F} 自动选择', ...proxyNames],
        },
        {
          name: '\u{267B}\u{FE0F} 自动选择',
          type: 'url-test',
          proxies: [...proxyNames],
          url: 'http://www.gstatic.com/generate_204',
          interval: 300,
          tolerance: 50,
        },
        {
          name: '\u{1F3AF} 全球直连',
          type: 'select',
          proxies: ['DIRECT'],
        },
        {
          name: '\u{1F6D1} 广告拦截',
          type: 'select',
          proxies: ['REJECT', 'DIRECT'],
        },
        {
          name: '\u{1F41F} 漏网之鱼',
          type: 'select',
          proxies: ['\u{1F680} 节点选择', 'DIRECT'],
        },
      ],
      ruleProviders: {
        BanAD: acl4ssrProvider('BanAD'),
        BanProgramAD: acl4ssrProvider('BanProgramAD'),
        BanEasyList: acl4ssrProvider('BanEasyList'),
        BanEasyListChina: acl4ssrProvider('BanEasyListChina'),
        BanEasyPrivacy: acl4ssrProvider('BanEasyPrivacy'),
        ChinaDomain: acl4ssrProvider('ChinaDomain'),
        ProxyLite: acl4ssrProvider('ProxyLite'),
      },
      rules: [
        'RULE-SET,BanAD,\u{1F6D1} 广告拦截',
        'RULE-SET,BanProgramAD,\u{1F6D1} 广告拦截',
        'RULE-SET,BanEasyList,\u{1F6D1} 广告拦截',
        'RULE-SET,BanEasyListChina,\u{1F6D1} 广告拦截',
        'RULE-SET,BanEasyPrivacy,\u{1F6D1} 广告拦截',
        'RULE-SET,ChinaDomain,\u{1F3AF} 全球直连',
        'RULE-SET,ProxyLite,\u{1F680} 节点选择',
        'MATCH,\u{1F41F} 漏网之鱼',
      ],
    }),
  },
];
