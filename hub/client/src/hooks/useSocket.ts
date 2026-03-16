import { useEffect, useRef } from "react";
import * as THREE from "three";
import { socket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";

export function useSocket() {
    const myNickname = useGameStore((state) => state.myNickname);
    const myBotId = useGameStore((state) => state.myBotId);
    const myCriteria = useGameStore((state) => state.myCriteria);
    const avatarColor = useGameStore((state) => state.avatarColor);
    const isStarted = useGameStore((state) => state.isStarted);
    const playerPosition = useGameStore((state) => state.playerPosition);

    const setOtherPlayers = useGameStore((state) => state.setOtherPlayers);
    const updateOtherPlayerPosition = useGameStore((state) => state.updateOtherPlayerPosition);
    const removeOtherPlayer = useGameStore((state) => state.removeOtherPlayer);
    const setNearAnnouncement = useGameStore((state) => state.setNearAnnouncement);
    const setBankGlowing = useGameStore((state) => state.setBankGlowing);
    const setWalkingToBankBotIds = useGameStore((state) => state.setWalkingToBankBotIds);
    const setTargetPosition = useGameStore((state) => state.setTargetPosition);
    const setIsAutoMoving = useGameStore((state) => state.setIsAutoMoving);
    const setBotBadges = useGameStore((state) => state.setBotBadges);
    const setSpectatorMatch = useGameStore((state) => state.setSpectatorMatch);
    const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);

    // 1. 소켓 연결 및 초기화
    useEffect(() => {
        if (!isStarted || !myNickname) return;

        console.log("Setting up socket listeners...");

        const onConnect = () => {
            console.log("Socket Connected! ID:", socket.id);
            socket.emit("join", { nickname: myNickname, botId: myBotId || undefined, criteria: myCriteria, avatarColor });
        };

        const onConnectError = (error: any) => {
            console.error("Socket Connection Error:", error);
        };

        // 서버 코드 기준: init 이벤트 (접속 시 현재 맵에 있는 유저 정보 수신)
        const onInit = (data: { id: string; users: any }) => {
            console.log("Socket Initialized - Received Users:", data);

            const myServerId = data.id || socket.id;
            const others = { ...data.users };

            // 나 자신 제외
            if (myServerId && others[myServerId]) {
                delete others[myServerId];
            }

            setOtherPlayers(others);
        };

        // 서버 코드 기준: playerJoined 이벤트 (새로운 유저 입장)
        const onPlayerJoined = (user: any) => {
            console.log("Player Joined:", user);
            updateOtherPlayerPosition(user.id, user.position, user.action, user.nickname, user.botId, user.isBot, user.avatarColor);
        };

        // 서버 코드 기준: playerMoved 이벤트
        const onPlayerMoved = (data: { id: string; position: { x: number; y: number; z: number } }) => {
            updateOtherPlayerPosition(data.id, data.position);
        };

        const onPlayerLeft = (data: { id: string }) => {
            console.log("Player Left:", data.id);
            removeOtherPlayer(data.id);
        };

        // NEAR 이벤트: 공지 배너 + 뱅크 글로우
        const onNearAnnouncement = (data: { message: string }) => {
            setNearAnnouncement(data.message);
            setBankGlowing(true);
            // 5초 후 자동 소거
            setTimeout(() => {
                setNearAnnouncement(null);
                setBankGlowing(false);
            }, 5000);
        };

        // NEAR 이벤트: 내 봇이 대상이면 뱅크로 이동
        const BANK_POSITION = new THREE.Vector3(0, 0, -12);
        const onWalkToBank = (data: { socketId: string; botId: string }) => {
            setWalkingToBankBotIds([data.botId]);
            // 내 봇이 대상인 경우 자동 이동
            if (data.socketId === socket.id) {
                setTargetPosition(BANK_POSITION);
                setIsAutoMoving(true);
            }
            // 3초 후 초기화
            setTimeout(() => setWalkingToBankBotIds([]), 4000);
        };

        // NEAR 이벤트: 뱃지 업데이트
        const onBadgeUpdate = (data: { botId: string; badges: { id: string; label: string; color: string; emoji: string }[] }) => {
            setBotBadges(data.botId, data.badges);
        };

        // 관전 모드: 매칭 시작
        const onMatchStarted = (data: { matchId: string; botAId: string; botBId: string }) => {
            setSpectatorMatch({ ...data, status: 'in_progress' });
        };

        // 씬 전환 완료: 로컬 플레이어 위치를 spawn 위치로 갱신
        const onSceneChanged = (data: { scene_id: string; spawn_position: [number, number, number] }) => {
            const [x, z] = [data.spawn_position[0], data.spawn_position[2]];
            setPlayerPosition({ x, y: data.spawn_position[1], z });
        };

        // 관전 모드: 매칭 완료
        const onMatchCompleted = (data: {
            matchId: string;
            botAId: string;
            botBId: string;
            score: number;
            summary: string;
            matchSignals: string[];
            passed: boolean;
        }) => {
            setSpectatorMatch({ ...data, status: 'completed' });
            // 10초 후 자동 소거
            setTimeout(() => setSpectatorMatch(null), 10000);
        };

        // 리스너 등록
        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.on("init", onInit);
        socket.on("playerJoined", onPlayerJoined);
        socket.on("playerMoved", onPlayerMoved);
        socket.on("playerLeft", onPlayerLeft);
        socket.on("nearAnnouncement", onNearAnnouncement);
        socket.on("walkToBank", onWalkToBank);
        socket.on("badgeUpdate", onBadgeUpdate);
        socket.on("matchStarted", onMatchStarted);
        socket.on("matchCompleted", onMatchCompleted);
        socket.on("sceneChanged", onSceneChanged);

        // 연결 시도 (리스너 등록 후)
        if (!socket.connected) {
            socket.io.opts.autoConnect = true;
            socket.connect();
        } else {
            // 이미 연결되어 있다면 join 바로 전송 (재진입 등)
            socket.emit("join", { nickname: myNickname, botId: myBotId || undefined, criteria: myCriteria, avatarColor });
        }

        return () => {
            console.log("Cleaning up socket listeners...");
            socket.off("connect", onConnect);
            socket.off("connect_error", onConnectError);
            socket.off("init", onInit);
            socket.off("playerJoined", onPlayerJoined);
            socket.off("playerMoved", onPlayerMoved);
            socket.off("playerLeft", onPlayerLeft);
            socket.off("nearAnnouncement", onNearAnnouncement);
            socket.off("walkToBank", onWalkToBank);
            socket.off("badgeUpdate", onBadgeUpdate);
            socket.off("matchStarted", onMatchStarted);
            socket.off("matchCompleted", onMatchCompleted);
            socket.off("sceneChanged", onSceneChanged);
        };
    }, [isStarted, myNickname, myBotId, myCriteria, avatarColor, setOtherPlayers, updateOtherPlayerPosition, removeOtherPlayer, setNearAnnouncement, setBankGlowing, setWalkingToBankBotIds, setTargetPosition, setIsAutoMoving, setBotBadges, setSpectatorMatch, setPlayerPosition]);

    // 2. 내 위치 전송 (Throttling 적용: 50ms)
    const lastEmitTime = useRef<number>(0);

    useEffect(() => {
        if (!isStarted || !socket.connected) return;

        const now = Date.now();
        if (now - lastEmitTime.current > 50) {
            // 서버 코드 기준: playerMove 이벤트
            socket.emit("playerMove", { position: playerPosition });
            lastEmitTime.current = now;
        }

    }, [playerPosition, isStarted]);
}
