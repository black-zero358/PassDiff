// ==========================================
// PassDiff - URL/Domain Normalization
// ==========================================

import type { NormalizedUrlResult } from './types';

// 敏感子域名列表 - 禁止自动合并
const RISK_SUBDOMAINS = [
    'dev', 'uat', 'test', 'staging', 'admin', 'prod', 'production',
    'api', 'internal', 'sandbox', 'demo', 'beta', 'alpha'
];

// 云服务商域名 - 需要特殊处理
const CLOUD_PROVIDERS = [
    'aws.amazon.com',
    'console.aws.amazon.com',
    'portal.azure.com',
    'console.cloud.google.com',
    'cloud.digitalocean.com'
];

/**
 * 归一化 URL，提取主域名
 * 示例: https://www.google.com/login → google.com
 */
export function normalizeUrl(url: string): NormalizedUrlResult {
    if (!url || url.trim() === '') {
        return { domain: '', hasRisk: false };
    }

    let domain = url.trim().toLowerCase();

    // 移除协议
    domain = domain.replace(/^https?:\/\//, '');

    // 移除路径和查询参数
    domain = domain.split('/')[0];
    domain = domain.split('?')[0];
    domain = domain.split('#')[0];

    // 移除端口号
    domain = domain.split(':')[0];

    // 检查是否为云服务商域名
    const isCloudProvider = CLOUD_PROVIDERS.some(cp => domain.includes(cp));
    if (isCloudProvider) {
        return {
            domain,
            hasRisk: true,
            riskReason: '云服务商域名，需要手动处理'
        };
    }

    // 检查是否包含敏感子域
    const parts = domain.split('.');
    const hasRiskSubdomain = parts.some(part =>
        RISK_SUBDOMAINS.includes(part.toLowerCase())
    );

    // 移除 www 前缀
    if (parts[0] === 'www') {
        parts.shift();
        domain = parts.join('.');
    }

    // 提取主域名 (保留最后两个或三个部分，取决于 TLD)
    const commonTLDs = ['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'me', 'cn', 'uk', 'de', 'jp'];
    const secondLevelTLDs = ['com.cn', 'co.uk', 'co.jp', 'com.au', 'co.nz'];

    // 检查是否为二级 TLD
    if (parts.length >= 3) {
        const lastTwo = parts.slice(-2).join('.');
        if (secondLevelTLDs.includes(lastTwo)) {
            domain = parts.slice(-3).join('.');
        } else if (commonTLDs.includes(parts[parts.length - 1])) {
            domain = parts.slice(-2).join('.');
        }
    }

    return {
        domain,
        hasRisk: hasRiskSubdomain,
        riskReason: hasRiskSubdomain ? '包含敏感子域名 (dev/test/admin 等)' : undefined
    };
}

/**
 * 生成唯一键: domain::username
 */
export function generateKey(domain: string, username: string): string {
    return `${domain.toLowerCase()}::${username.toLowerCase()}`;
}

/**
 * 检查域名是否包含风险子域
 */
export function hasRiskSubdomain(url: string): boolean {
    return normalizeUrl(url).hasRisk;
}
