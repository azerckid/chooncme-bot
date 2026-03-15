/**
 * 봇 설정 관리 — Bot ID 생성/유지
 * 저장 위치: ~/.chooncme/config.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

const CONFIG_DIR = path.join(os.homedir(), '.chooncme');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export type Config = {
  botId: string;          // UUID — v0.3+에서 지갑 주소로 교체 가능하도록 추상화
  serverUrl: string;      // 클라우드 에이전트 서버 URL
  ownerEmail?: string;    // 매칭 알림 수신 이메일 (선택)
  nearAccount?: string;   // .near 계정 (v0.8 온체인 연동용, 선택)
};

const DEFAULT_CONFIG: Omit<Config, 'botId'> = {
  serverUrl: 'http://localhost:3000',
};

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensureConfigDir();

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw) as Config;
    } catch {
      // 손상 시 재생성
    }
  }

  // 최초 실행: Bot ID 신규 생성
  const config: Config = {
    botId: crypto.randomUUID(),
    ...DEFAULT_CONFIG,
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  return config;
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}
