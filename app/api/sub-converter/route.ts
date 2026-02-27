// app/api/sub-converter/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchSubscription, parseProxyURI, ClashProxy } from './parsers';
import { AdvancedOptions, applyAdvancedOptions } from './presets';
import { generateClashConfig } from './clash';

/* ------------------------------------------------------------------ */
/*  Shared logic: fetch → parse → apply → generate                     */
/* ------------------------------------------------------------------ */

interface ConvertResult {
  yaml: string;
  count: number;
  errors: string[];
}

async function convert(
  urls: string,
  preset: string = 'default',
  advanced?: AdvancedOptions,
): Promise<ConvertResult> {
  // 1. Fetch subscription URIs
  const uris = await fetchSubscription(urls);

  // 2. Parse each URI
  const proxies: ClashProxy[] = [];
  const errors: string[] = [];

  for (const uri of uris) {
    const proxy = parseProxyURI(uri);
    if (proxy) {
      proxies.push(proxy);
    } else {
      errors.push(`无法解析: ${uri.slice(0, 80)}`);
    }
  }

  if (proxies.length === 0) {
    throw new ConvertError(422, '未能解析出任何有效节点');
  }

  // 3. Apply advanced options
  let finalProxies = proxies;
  if (advanced) {
    finalProxies = applyAdvancedOptions(proxies, advanced);
    if (finalProxies.length === 0) {
      throw new ConvertError(422, '过滤后没有剩余节点');
    }
  }

  // 4. Generate Clash config
  const yamlOutput = generateClashConfig(finalProxies, preset);

  return {
    yaml: yamlOutput,
    count: finalProxies.length,
    errors: errors.length > 0 ? errors : [],
  };
}

/* ------------------------------------------------------------------ */
/*  Custom error class                                                 */
/* ------------------------------------------------------------------ */

class ConvertError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, preset, advanced } = body as {
      urls?: string;
      preset?: string;
      advanced?: AdvancedOptions;
    };

    // Validate urls
    if (!urls || typeof urls !== 'string' || urls.trim().length === 0) {
      return NextResponse.json(
        { error: '请提供订阅链接' },
        { status: 400 },
      );
    }

    // Validate each URL in the list
    const urlList = urls
      .split(/[\n|]/)
      .map((u) => u.trim())
      .filter(Boolean);

    for (const url of urlList) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: `无效的 URL: ${url}` },
          { status: 400 },
        );
      }
    }

    const result = await convert(urls, preset, advanced);

    return NextResponse.json({
      yaml: result.yaml,
      count: result.count,
      ...(result.errors.length > 0 ? { errors: result.errors } : {}),
    });
  } catch (err) {
    if (err instanceof ConvertError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status },
      );
    }

    const message = err instanceof Error ? err.message : String(err);

    // Fetch failures from fetchSubscription
    if (message.includes('获取订阅失败')) {
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET handler                                                        */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const url = searchParams.get('url');
    if (!url) {
      return new Response('缺少 url 参数', { status: 400 });
    }

    const preset = searchParams.get('preset') || 'default';

    // Build AdvancedOptions from query params
    const advanced: AdvancedOptions = {};
    let hasAdvanced = false;

    if (searchParams.get('emoji') === '1') {
      advanced.addEmoji = true;
      hasAdvanced = true;
    }
    if (searchParams.get('udp') === '1') {
      advanced.udp = true;
      hasAdvanced = true;
    }
    if (searchParams.get('scert') === '1') {
      advanced.skipCertVerify = true;
      hasAdvanced = true;
    }
    const include = searchParams.get('include');
    if (include) {
      advanced.includeRegex = include;
      hasAdvanced = true;
    }
    const exclude = searchParams.get('exclude');
    if (exclude) {
      advanced.excludeRegex = exclude;
      hasAdvanced = true;
    }

    const result = await convert(
      url,
      preset,
      hasAdvanced ? advanced : undefined,
    );

    const filename = searchParams.get('filename') || 'clash-config';

    return new Response(result.yaml, {
      status: 200,
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.yaml"`,
      },
    });
  } catch (err) {
    if (err instanceof ConvertError) {
      return new Response(err.message, { status: err.status });
    }

    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('获取订阅失败')) {
      return new Response(message, { status: 502 });
    }

    return new Response('服务器内部错误', { status: 500 });
  }
}
