import { useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";

export const useKeyboard = () => {
    const { setKeyPressed, setDirectionOffset, directionOffset } = useGameStore();

    useEffect(() => {
        const mapKey = (key: string) => {
            switch (key) {
                case "arrowup": return "w";
                case "arrowdown": return "s";
                case "arrowleft": return "a";
                case "arrowright": return "d";
                default: return key;
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            // 입력 필드 포커스 시 무시
            const target = document.activeElement as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

            const key = mapKey(event.key.toLowerCase());
            useGameStore.setState((state) => ({
                keyPressed: { ...state.keyPressed, [key]: true }
            }));
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            // 입력 필드 포커스 시에는 키 떼기 이벤트도 무시할 수 있으나,
            // 키가 '눌린 채로' 채팅을 시작했을 때 캐릭터가 계속 가는 것을 방지하려면
            // keyUp은 허용하거나, 채팅 시작 시 상태를 reset하는 것이 안전함.
            // 여기서는 일단 keyUp은 허용하여 멈추게 함.

            const key = mapKey(event.key.toLowerCase());
            useGameStore.setState((state) => ({
                keyPressed: { ...state.keyPressed, [key]: false }
            }));
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // Compute direction offset based on pressed keys
    useEffect(() => {
        const unsubscribe = useGameStore.subscribe(
            (state) => state.keyPressed,
            (pressedKeys) => {
                let newOffset = directionOffset;
                const { w, a, s, d } = pressedKeys;

                if (w) {
                    if (a) {
                        newOffset = -Math.PI + Math.PI / 4; // w+a
                    } else if (d) {
                        newOffset = -Math.PI - Math.PI / 4; // w+d
                    } else {
                        newOffset = Math.PI; // w
                    }
                } else if (s) {
                    if (a) {
                        newOffset = -Math.PI / 4; // s+a
                    } else if (d) {
                        newOffset = Math.PI / 4; // s+d
                    } else {
                        newOffset = 0; // s
                    }
                } else if (a) {
                    newOffset = -Math.PI / 2; // a
                } else if (d) {
                    newOffset = Math.PI / 2; // d
                }

                if (newOffset !== directionOffset) {
                    setDirectionOffset(newOffset);
                }
            }
        );

        return () => unsubscribe();
    }, [directionOffset, setDirectionOffset]);
};
