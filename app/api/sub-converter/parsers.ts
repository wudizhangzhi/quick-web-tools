// app/api/sub-converter/parsers.ts

export interface ClashProxy {
  name: string;
  type: string;
  server: string;
  port: number;
  [key: string]: unknown;
}

export interface SubscriptionResult {
  uris: string[];
  headers: Record<string, string>;
}

/**
 * Fetch and decode subscription content from one or more URLs.
 * URLs are separated by newlines or '|'.
 * Also captures upstream headers (subscription-userinfo, profile-update-interval, etc.)
 */
export async function fetchSubscription(urls: string): Promise<SubscriptionResult> {
  const urlList = urls
    .split(/[\n|]/)
    .map((u) => u.trim())
    .filter(Boolean);

  const allUris: string[] = [];
  const headers: Record<string, string> = {};

  for (const url of urlList) {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ClashForAndroid/2.5.12' },
    });
    if (!response.ok) {
      throw new Error(`获取订阅失败 (${url}): HTTP ${response.status}`);
    }

    // Capture upstream subscription headers (use first URL's headers)
    if (Object.keys(headers).length === 0) {
      const subInfo = response.headers.get('subscription-userinfo');
      if (subInfo) headers['subscription-userinfo'] = subInfo;
      const updateInterval = response.headers.get('profile-update-interval');
      if (updateInterval) headers['profile-update-interval'] = updateInterval;
      const webPage = response.headers.get('profile-web-page-url');
      if (webPage) headers['profile-web-page-url'] = webPage;
    }

    const raw = (await response.text()).trim();

    // Detect if content is already plain text (starts with a protocol URI)
    // or base64-encoded
    const PROTOCOLS = /^(vmess|vless|trojan|ss|ssr):\/\//;
    let text: string;
    if (PROTOCOLS.test(raw)) {
      text = raw;
    } else {
      text = Buffer.from(raw, 'base64').toString('utf-8');
    }

    const uris = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    allUris.push(...uris);
  }

  return { uris: allUris, headers };
}

/**
 * Parse a single proxy URI and return a Clash proxy object
 */
export function parseProxyURI(uri: string): ClashProxy | null {
  if (uri.startsWith('vmess://')) return parseVmess(uri);
  if (uri.startsWith('vless://')) return parseVless(uri);
  if (uri.startsWith('trojan://')) return parseTrojan(uri);
  if (uri.startsWith('ss://')) return parseSS(uri);
  return null;
}

// VMess parser (v2rayN format: vmess://base64JSON)
// JSON fields: {v, ps, add, port, id, aid, scy, net, type, host, path, tls, sni}
function parseVmess(uri: string): ClashProxy | null {
  try {
    const encoded = uri.slice('vmess://'.length);
    const json = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));

    const proxy: ClashProxy = {
      name: json.ps || `vmess-${json.add}:${json.port}`,
      type: 'vmess',
      server: json.add,
      port: Number(json.port),
      uuid: json.id,
      alterId: Number(json.aid || 0),
      cipher: json.scy || 'auto',
    };

    if (json.tls === 'tls') {
      proxy.tls = true;
      if (json.sni) proxy.servername = json.sni;
      if (json.alpn) proxy.alpn = json.alpn.split(',');
      proxy['skip-cert-verify'] = false;
    }

    const net = json.net || 'tcp';
    if (net !== 'tcp') proxy.network = net;

    if (net === 'ws') {
      const wsOpts: Record<string, unknown> = {};
      if (json.path) wsOpts.path = json.path;
      if (json.host) wsOpts.headers = { Host: json.host };
      proxy['ws-opts'] = wsOpts;
    } else if (net === 'h2') {
      const h2Opts: Record<string, unknown> = {};
      if (json.path) h2Opts.path = json.path;
      if (json.host) h2Opts.host = [json.host];
      proxy['h2-opts'] = h2Opts;
    } else if (net === 'grpc') {
      const grpcOpts: Record<string, unknown> = {};
      if (json.path) grpcOpts['grpc-service-name'] = json.path;
      proxy['grpc-opts'] = grpcOpts;
    }

    return proxy;
  } catch {
    return null;
  }
}

// VLESS parser (vless://uuid@server:port?params#remark)
function parseVless(uri: string): ClashProxy | null {
  try {
    const url = new URL(uri);
    const params = url.searchParams;

    const proxy: ClashProxy = {
      name:
        decodeURIComponent(url.hash.slice(1)) ||
        `vless-${url.hostname}:${url.port}`,
      type: 'vless',
      server: url.hostname,
      port: Number(url.port),
      uuid: url.username,
      tls:
        params.get('security') === 'tls' ||
        params.get('security') === 'reality',
      'skip-cert-verify': false,
    };

    const flow = params.get('flow');
    if (flow) proxy.flow = flow;
    const sni = params.get('sni');
    if (sni) proxy.servername = sni;
    const alpn = params.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');
    const fp = params.get('fp');
    if (fp) proxy['client-fingerprint'] = fp;

    // Encryption (supports ML-KEM post-quantum encryption in mihomo)
    const encryption = params.get('encryption');
    if (encryption && encryption !== 'none') proxy.encryption = encryption;

    if (params.get('security') === 'reality') {
      const realityOpts: Record<string, string> = {};
      const pbk = params.get('pbk');
      if (pbk) realityOpts['public-key'] = pbk;
      const sid = params.get('sid');
      if (sid) realityOpts['short-id'] = sid;
      proxy['reality-opts'] = realityOpts;
    }

    const type = params.get('type') || 'tcp';
    if (type !== 'tcp') proxy.network = type;

    if (type === 'ws') {
      const wsOpts: Record<string, unknown> = {};
      const path = params.get('path');
      if (path) wsOpts.path = decodeURIComponent(path);
      const host = params.get('host');
      if (host) wsOpts.headers = { Host: host };
      proxy['ws-opts'] = wsOpts;
    } else if (type === 'grpc') {
      const grpcOpts: Record<string, unknown> = {};
      const sn = params.get('serviceName');
      if (sn) grpcOpts['grpc-service-name'] = sn;
      proxy['grpc-opts'] = grpcOpts;
    } else if (type === 'h2') {
      const h2Opts: Record<string, unknown> = {};
      const path = params.get('path');
      if (path) h2Opts.path = decodeURIComponent(path);
      const host = params.get('host');
      if (host) h2Opts.host = [host];
      proxy['h2-opts'] = h2Opts;
    }

    return proxy;
  } catch {
    return null;
  }
}

// Trojan parser (trojan://password@server:port?params#remark)
function parseTrojan(uri: string): ClashProxy | null {
  try {
    const url = new URL(uri);
    const params = url.searchParams;

    const proxy: ClashProxy = {
      name:
        decodeURIComponent(url.hash.slice(1)) ||
        `trojan-${url.hostname}:${url.port}`,
      type: 'trojan',
      server: url.hostname,
      port: Number(url.port),
      password: decodeURIComponent(url.username),
      'skip-cert-verify': false,
    };

    const sni = params.get('sni');
    if (sni) proxy.sni = sni;
    const alpn = params.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');
    const fp = params.get('fp');
    if (fp) proxy['client-fingerprint'] = fp;

    const type = params.get('type') || 'tcp';
    if (type !== 'tcp') proxy.network = type;

    if (type === 'ws') {
      const wsOpts: Record<string, unknown> = {};
      const path = params.get('path');
      if (path) wsOpts.path = decodeURIComponent(path);
      const host = params.get('host');
      if (host) wsOpts.headers = { Host: host };
      proxy['ws-opts'] = wsOpts;
    } else if (type === 'grpc') {
      const grpcOpts: Record<string, unknown> = {};
      const sn = params.get('serviceName');
      if (sn) grpcOpts['grpc-service-name'] = sn;
      proxy['grpc-opts'] = grpcOpts;
    }

    return proxy;
  } catch {
    return null;
  }
}

// Shadowsocks parser
// Format 1: ss://base64(method:password)@server:port#remark
// Format 2: ss://base64(method:password@server:port)#remark
function parseSS(uri: string): ClashProxy | null {
  try {
    const content = uri.slice('ss://'.length);
    let method: string,
      password: string,
      server: string,
      port: number,
      name: string;

    const hashIndex = content.indexOf('#');
    name =
      hashIndex !== -1
        ? decodeURIComponent(content.slice(hashIndex + 1))
        : '';
    const mainPart = hashIndex !== -1 ? content.slice(0, hashIndex) : content;

    if (mainPart.includes('@')) {
      const atIndex = mainPart.lastIndexOf('@');
      const encodedPart = mainPart.slice(0, atIndex);
      const serverPart = mainPart.slice(atIndex + 1);
      const decoded = Buffer.from(encodedPart, 'base64').toString('utf-8');
      const colonIndex = decoded.indexOf(':');
      method = decoded.slice(0, colonIndex);
      password = decoded.slice(colonIndex + 1);
      const lastColon = serverPart.lastIndexOf(':');
      server = serverPart.slice(0, lastColon);
      port = Number(serverPart.slice(lastColon + 1));
    } else {
      const decoded = Buffer.from(mainPart, 'base64').toString('utf-8');
      const atIndex = decoded.lastIndexOf('@');
      const methodPassword = decoded.slice(0, atIndex);
      const serverPort = decoded.slice(atIndex + 1);
      const colonIndex = methodPassword.indexOf(':');
      method = methodPassword.slice(0, colonIndex);
      password = methodPassword.slice(colonIndex + 1);
      const lastColon = serverPort.lastIndexOf(':');
      server = serverPort.slice(0, lastColon);
      port = Number(serverPort.slice(lastColon + 1));
    }

    if (!name) name = `ss-${server}:${port}`;

    return { name, type: 'ss', server, port, cipher: method, password };
  } catch {
    return null;
  }
}
