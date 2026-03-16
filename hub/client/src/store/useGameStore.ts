import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import * as THREE from "three";

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

interface LightingSettings {
  ambientIntensity: number;
  directionalIntensity: number;
  hemisphereIntensity: number;
  pointIntensity: number;
  skyEnabled: boolean;
  environmentPreset: "city" | "warehouse" | "apartment" | "forest" | "lobby" | "night" | "park" | "studio" | "sunset" | "dawn";
}

export interface OtherPlayer {
  id: string;
  position: PlayerPosition;
  action?: string;
  nickname?: string;
  botId?: string;
  isBot?: boolean;
  avatarColor?: string;
}

interface GameState {
  // 키보드 입력 상태
  keyPressed: Record<string, boolean>;
  // 캐릭터 애니메이션 상태 (Run, Walk, Idle 등)
  action: string;
  // 플레이어 위치
  playerPosition: PlayerPosition;
  // 이동 방향 오프셋
  directionOffset: number;
  isStarted: boolean;

  // 조명 설정
  lighting: LightingSettings;

  // 클릭 이동 상태
  targetPosition: THREE.Vector3 | null;
  isAutoMoving: boolean;

  // 멀티플레이어 상태
  otherPlayers: Record<string, OtherPlayer>;
  myNickname: string;
  myBotId: string;
  myCriteria: { region?: string; interests?: string[] };
  avatarColor: string;

  // NEAR 이벤트 상태
  nearAnnouncement: string | null;
  bankGlowing: boolean;
  walkingToBankBotIds: string[];

  // 뱃지 상태 — botId → Badge[]
  botBadges: Record<string, { id: string; label: string; color: string; emoji: string }[]>;

  // 관전 모드 상태
  spectatorMatch: {
    matchId: string;
    botAId: string;
    botBId: string;
    status: 'in_progress' | 'completed';
    score?: number;
    summary?: string;
    matchSignals?: string[];
    passed?: boolean;
  } | null;

  // Actions
  setKeyPressed: (keys: Record<string, boolean>) => void;
  setAction: (action: string) => void;
  setPlayerPosition: (position: PlayerPosition) => void;
  setDirectionOffset: (offset: number) => void;
  setIsStarted: (isStarted: boolean) => void;
  setLighting: (settings: Partial<LightingSettings>) => void;
  setTargetPosition: (pos: THREE.Vector3 | null) => void;
  setIsAutoMoving: (isAutoMoving: boolean) => void;

  // 멀티플레이어 액션
  setOtherPlayers: (players: Record<string, OtherPlayer>) => void;
  setMyNickname: (nickname: string) => void;
  setMyBotId: (botId: string) => void;
  setMyCriteria: (criteria: { region?: string; interests?: string[] }) => void;
  setAvatarColor: (color: string) => void;
  updateOtherPlayerPosition: (id: string, position: PlayerPosition, action?: string, nickname?: string, botId?: string, isBot?: boolean, avatarColor?: string) => void;
  removeOtherPlayer: (id: string) => void;

  // NEAR 이벤트 액션
  setNearAnnouncement: (message: string | null) => void;
  setBankGlowing: (glowing: boolean) => void;
  setWalkingToBankBotIds: (botIds: string[]) => void;
  setBotBadges: (botId: string, badges: { id: string; label: string; color: string; emoji: string }[]) => void;
  setSpectatorMatch: (match: GameState['spectatorMatch']) => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set) => ({
    keyPressed: {},
    action: "Run",
    playerPosition: { x: 0, y: 0, z: 0 },
    directionOffset: 0,
    isStarted: false,

    lighting: {
      ambientIntensity: 2.0,
      directionalIntensity: 4.0,
      hemisphereIntensity: 1.0,
      pointIntensity: 2.0,
      skyEnabled: true,
      environmentPreset: "city",
    },

    // 클릭 이동 상태
    targetPosition: null,
    isAutoMoving: false,

    otherPlayers: {},
    myNickname: "",
    myBotId: "",
    myCriteria: {},
    avatarColor: "#ff6eb4",

    nearAnnouncement: null,
    bankGlowing: false,
    walkingToBankBotIds: [],
    botBadges: {},
    spectatorMatch: null,

    setKeyPressed: (keys) => {
      // 키보드 입력이 발생하면 자동 이동 취소
      const hasInput = Object.values(keys).some(v => v);
      return set((state) => ({
        keyPressed: keys,
        isAutoMoving: hasInput ? false : state.isAutoMoving,
        targetPosition: hasInput ? null : state.targetPosition
      }));
    },
    setAction: (action) => set({ action }),
    setPlayerPosition: (position) => set({ playerPosition: position }),
    setDirectionOffset: (offset) => set({ directionOffset: offset }),
    setIsStarted: (isStarted) => set({ isStarted }),
    setLighting: (settings) => set((state) => ({
      lighting: { ...state.lighting, ...settings }
    })),
    setTargetPosition: (pos) => set({ targetPosition: pos }),
    setIsAutoMoving: (isAutoMoving) => set({ isAutoMoving }),

    setOtherPlayers: (players) => set({ otherPlayers: players }),
    setMyNickname: (nickname) => set({ myNickname: nickname }),
    setMyBotId: (botId) => set({ myBotId: botId }),
    setMyCriteria: (criteria) => set({ myCriteria: criteria }),
    setAvatarColor: (color) => set({ avatarColor: color }),
    updateOtherPlayerPosition: (id, position, action = "Idle", nickname, botId, isBot, avatarColor) => set((state) => ({
      otherPlayers: {
        ...state.otherPlayers,
        [id]: {
          ...state.otherPlayers[id],
          id,
          position,
          action: action || state.otherPlayers[id]?.action,
          nickname: nickname || state.otherPlayers[id]?.nickname,
          botId: botId || state.otherPlayers[id]?.botId,
          isBot: isBot ?? state.otherPlayers[id]?.isBot,
          avatarColor: avatarColor || state.otherPlayers[id]?.avatarColor,
        }
      }
    })),
    removeOtherPlayer: (id) => set((state) => {
      const newPlayers = { ...state.otherPlayers };
      delete newPlayers[id];
      return { otherPlayers: newPlayers };
    }),

    setNearAnnouncement: (message) => set({ nearAnnouncement: message }),
    setBankGlowing: (glowing) => set({ bankGlowing: glowing }),
    setWalkingToBankBotIds: (botIds) => set({ walkingToBankBotIds: botIds }),
    setBotBadges: (botId, badges) => set((state) => ({
      botBadges: { ...state.botBadges, [botId]: badges }
    })),
    setSpectatorMatch: (match) => set({ spectatorMatch: match }),
  }))
);
