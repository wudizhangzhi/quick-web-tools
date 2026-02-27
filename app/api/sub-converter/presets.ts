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
        {
          name: '\u{1F3AF} 全球直连',
          type: 'select',
          proxies: ['DIRECT'],
        },
      ],
      rules: [
        'GEOIP,CN,\u{1F3AF} 全球直连',
        'MATCH,\u{1F680} 节点选择',
      ],
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
        {
          name: '\u{1F3AF} 全球直连',
          type: 'select',
          proxies: ['DIRECT'],
        },
      ],
      rules: [
        'GEOIP,CN,\u{1F3AF} 全球直连',
        'MATCH,\u{1F680} 节点选择',
      ],
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
        'GEOIP,CN,\u{1F3AF} 全球直连',
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
        'GEOIP,CN,\u{1F3AF} 全球直连',
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
        'GEOIP,CN,\u{1F3AF} 全球直连',
        'MATCH,\u{1F41F} 漏网之鱼',
      ],
    }),
  },

  /* ---------- sub-v1mk (ACL4SSR_Online_Full_NoAuto) ---------- */
  {
    id: 'sub-v1mk',
    name: '仿 sub.v1.mk (Full_NoAuto)',
    description:
      '完全仿照 sub.v1.mk 默认配置 ACL4SSR_Online_Full_NoAuto，24个分组含地区节点',
    build: (proxyNames) => {
      // Regional / special node filtering (fallback to all proxies if no match)
      const filter = (re: RegExp) => {
        const m = proxyNames.filter((n) => re.test(n));
        return m.length > 0 ? m : proxyNames;
      };
      const hk = filter(/(港|HK|hk|Hong Kong|HongKong|hongkong)/);
      const tw = filter(/(台|新北|彰化|TW|Taiwan)/);
      const sg = filter(/(新加坡|坡|狮城|SG|Singapore)/i);
      const jp = filter(
        /(日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan)/i,
      );
      const us = filter(
        /(美|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|US|United States)/i,
      );
      const kr = filter(/(KR|Korea|KOR|首尔|韩|韓)/i);
      const nf = filter(/(NF|奈飞|解锁|Netflix|NETFLIX|Media)/i);
      const music = filter(/(网易|音乐|解锁|Music|NetEase)/i);

      return {
        proxyGroups: [
          {
            name: '\u{1F680} 节点选择',
            type: 'select',
            proxies: [
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
              'DIRECT',
            ],
          },
          {
            name: '\u{1F680} 手动切换',
            type: 'select',
            proxies: [...proxyNames],
          },
          {
            name: '\u{1F4F2} 电报消息',
            type: 'select',
            proxies: [
              '\u{1F680} 节点选择',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
              'DIRECT',
            ],
          },
          {
            name: '\u{1F4AC} Ai平台',
            type: 'select',
            proxies: [
              '\u{1F680} 节点选择',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
              'DIRECT',
            ],
          },
          {
            name: '\u{1F4F9} 油管视频',
            type: 'select',
            proxies: [
              '\u{1F680} 节点选择',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
              'DIRECT',
            ],
          },
          {
            name: '\u{1F3A5} 奈飞视频',
            type: 'select',
            proxies: [
              '\u{1F3A5} 奈飞节点',
              '\u{1F680} 节点选择',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
              'DIRECT',
            ],
          },
          {
            name: '\u{1F4FA} 巴哈姆特',
            type: 'select',
            proxies: [
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F680} 节点选择',
              '\u{1F680} 手动切换',
              'DIRECT',
            ],
          },
          {
            name: '\u{1F4FA} 哔哩哔哩',
            type: 'select',
            proxies: [
              '\u{1F3AF} 全球直连',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
            ],
          },
          {
            name: '\u{1F30D} 国外媒体',
            type: 'select',
            proxies: [
              '\u{1F680} 节点选择',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
              'DIRECT',
            ],
          },
          {
            name: '\u{1F30F} 国内媒体',
            type: 'select',
            proxies: [
              'DIRECT',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F680} 手动切换',
            ],
          },
          {
            name: '\u{1F4E2} 谷歌FCM',
            type: 'select',
            proxies: [
              'DIRECT',
              '\u{1F680} 节点选择',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
            ],
          },
          {
            name: '\u{24C2}\u{FE0F} 微软Bing',
            type: 'select',
            proxies: [
              'DIRECT',
              '\u{1F680} 节点选择',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
            ],
          },
          {
            name: '\u{24C2}\u{FE0F} 微软云盘',
            type: 'select',
            proxies: [
              'DIRECT',
              '\u{1F680} 节点选择',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
            ],
          },
          {
            name: '\u{24C2}\u{FE0F} 微软服务',
            type: 'select',
            proxies: [
              'DIRECT',
              '\u{1F680} 节点选择',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
            ],
          },
          {
            name: '\u{1F34E} 苹果服务',
            type: 'select',
            proxies: [
              'DIRECT',
              '\u{1F680} 节点选择',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
            ],
          },
          {
            name: '\u{1F3AE} 游戏平台',
            type: 'select',
            proxies: [
              'DIRECT',
              '\u{1F680} 节点选择',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
            ],
          },
          {
            name: '\u{1F3B6} 网易音乐',
            type: 'select',
            proxies: ['DIRECT', '\u{1F680} 节点选择', ...music],
          },
          {
            name: '\u{1F3AF} 全球直连',
            type: 'select',
            proxies: ['DIRECT', '\u{1F680} 节点选择'],
          },
          {
            name: '\u{1F6D1} 广告拦截',
            type: 'select',
            proxies: ['REJECT', 'DIRECT'],
          },
          {
            name: '\u{1F343} 应用净化',
            type: 'select',
            proxies: ['REJECT', 'DIRECT'],
          },
          {
            name: '\u{1F41F} 漏网之鱼',
            type: 'select',
            proxies: [
              '\u{1F680} 节点选择',
              'DIRECT',
              '\u{1F1ED}\u{1F1F0} 香港节点',
              '\u{1F1E8}\u{1F1F3} 台湾节点',
              '\u{1F1F8}\u{1F1EC} 狮城节点',
              '\u{1F1EF}\u{1F1F5} 日本节点',
              '\u{1F1FA}\u{1F1F2} 美国节点',
              '\u{1F1F0}\u{1F1F7} 韩国节点',
              '\u{1F680} 手动切换',
            ],
          },
          // Regional node groups
          {
            name: '\u{1F1ED}\u{1F1F0} 香港节点',
            type: 'select',
            proxies: [...hk],
          },
          {
            name: '\u{1F1EF}\u{1F1F5} 日本节点',
            type: 'select',
            proxies: [...jp],
          },
          {
            name: '\u{1F1FA}\u{1F1F2} 美国节点',
            type: 'select',
            proxies: [...us],
          },
          {
            name: '\u{1F1F8}\u{1F1EC} 狮城节点',
            type: 'select',
            proxies: [...sg],
          },
          {
            name: '\u{1F1E8}\u{1F1F3} 台湾节点',
            type: 'select',
            proxies: [...tw],
          },
          {
            name: '\u{1F1F0}\u{1F1F7} 韩国节点',
            type: 'select',
            proxies: [...kr],
          },
          {
            name: '\u{1F3A5} 奈飞节点',
            type: 'select',
            proxies: [...nf],
          },
        ],
        ruleProviders: {
          LocalAreaNetwork: acl4ssrProvider('LocalAreaNetwork'),
          UnBan: acl4ssrProvider('UnBan'),
          BanAD: acl4ssrProvider('BanAD'),
          BanProgramAD: acl4ssrProvider('BanProgramAD'),
          GoogleFCM: acl4ssrProvider('Ruleset/GoogleFCM'),
          GoogleCN: acl4ssrProvider('GoogleCN'),
          SteamCN: acl4ssrProvider('Ruleset/SteamCN'),
          Bing: acl4ssrProvider('Ruleset/Bing'),
          OneDrive: acl4ssrProvider('Ruleset/OneDrive'),
          Microsoft: acl4ssrProvider('Ruleset/Microsoft'),
          Apple: acl4ssrProvider('Ruleset/Apple'),
          Telegram: acl4ssrProvider('Ruleset/Telegram'),
          AI: acl4ssrProvider('Ruleset/AI'),
          OpenAi: acl4ssrProvider('Ruleset/OpenAi'),
          NetEaseMusic: acl4ssrProvider('Ruleset/NetEaseMusic'),
          Epic: acl4ssrProvider('Ruleset/Epic'),
          Origin: acl4ssrProvider('Ruleset/Origin'),
          Sony: acl4ssrProvider('Ruleset/Sony'),
          Steam: acl4ssrProvider('Ruleset/Steam'),
          Nintendo: acl4ssrProvider('Ruleset/Nintendo'),
          YouTube: acl4ssrProvider('Ruleset/YouTube'),
          Netflix: acl4ssrProvider('Ruleset/Netflix'),
          Bahamut: acl4ssrProvider('Ruleset/Bahamut'),
          BilibiliHMT: acl4ssrProvider('Ruleset/BilibiliHMT'),
          Bilibili: acl4ssrProvider('Ruleset/Bilibili'),
          ChinaMedia: acl4ssrProvider('ChinaMedia'),
          ProxyMedia: acl4ssrProvider('ProxyMedia'),
          ProxyGFWlist: acl4ssrProvider('ProxyGFWlist'),
          ChinaDomain: acl4ssrProvider('ChinaDomain'),
          ChinaCompanyIp: acl4ssrProvider('ChinaCompanyIp'),
          Download: acl4ssrProvider('Download'),
        },
        rules: [
          'RULE-SET,LocalAreaNetwork,\u{1F3AF} 全球直连',
          'RULE-SET,UnBan,\u{1F3AF} 全球直连',
          'RULE-SET,BanAD,\u{1F6D1} 广告拦截',
          'RULE-SET,BanProgramAD,\u{1F343} 应用净化',
          'RULE-SET,GoogleFCM,\u{1F4E2} 谷歌FCM',
          'RULE-SET,GoogleCN,\u{1F3AF} 全球直连',
          'RULE-SET,SteamCN,\u{1F3AF} 全球直连',
          'RULE-SET,Bing,\u{24C2}\u{FE0F} 微软Bing',
          'RULE-SET,OneDrive,\u{24C2}\u{FE0F} 微软云盘',
          'RULE-SET,Microsoft,\u{24C2}\u{FE0F} 微软服务',
          'RULE-SET,Apple,\u{1F34E} 苹果服务',
          'RULE-SET,Telegram,\u{1F4F2} 电报消息',
          'RULE-SET,AI,\u{1F4AC} Ai平台',
          'RULE-SET,OpenAi,\u{1F4AC} Ai平台',
          'RULE-SET,NetEaseMusic,\u{1F3B6} 网易音乐',
          'RULE-SET,Epic,\u{1F3AE} 游戏平台',
          'RULE-SET,Origin,\u{1F3AE} 游戏平台',
          'RULE-SET,Sony,\u{1F3AE} 游戏平台',
          'RULE-SET,Steam,\u{1F3AE} 游戏平台',
          'RULE-SET,Nintendo,\u{1F3AE} 游戏平台',
          'RULE-SET,YouTube,\u{1F4F9} 油管视频',
          'RULE-SET,Netflix,\u{1F3A5} 奈飞视频',
          'RULE-SET,Bahamut,\u{1F4FA} 巴哈姆特',
          'RULE-SET,BilibiliHMT,\u{1F4FA} 哔哩哔哩',
          'RULE-SET,Bilibili,\u{1F4FA} 哔哩哔哩',
          'RULE-SET,ChinaMedia,\u{1F30F} 国内媒体',
          'RULE-SET,ProxyMedia,\u{1F30D} 国外媒体',
          'RULE-SET,ProxyGFWlist,\u{1F680} 节点选择',
          'RULE-SET,ChinaDomain,\u{1F3AF} 全球直连',
          'RULE-SET,ChinaCompanyIp,\u{1F3AF} 全球直连',
          'RULE-SET,Download,\u{1F3AF} 全球直连',
          'GEOIP,CN,\u{1F3AF} 全球直连',
          'MATCH,\u{1F41F} 漏网之鱼',
        ],
      };
    },
  },
];
