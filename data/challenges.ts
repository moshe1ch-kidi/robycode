import { RobotState } from '../types';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    check: (startState: RobotState, endState: RobotState, history: SimulationHistory) => boolean;
}

export interface SimulationHistory {
    maxDistanceMoved: number;
    touchedWall: boolean;
    detectedColors: string[];
    totalRotation: number;
}

export const CHALLENGES: Challenge[] = [
    {
        id: 'c1',
        title: 'צעד ראשון',
        description: 'כתוב תוכנית שגורמת לרובוט לנסוע קדימה לפחות 20 ס"מ.',
        difficulty: 'Easy',
        check: (start, end, history) => {
            // Distance formula on X/Z plane
            const dx = end.x - start.x;
            const dz = end.z - start.z;
            const dist = Math.sqrt(dx*dx + dz*dz); 
            // 20cm is 2 simulation units
            return dist >= 2.0;
        }
    },
    {
        id: 'c2',
        title: 'סיבוב מלא',
        description: 'סובב את הרובוט ב-360 מעלות (עיגול שלם) לצד שמאל או ימין.',
        difficulty: 'Easy',
        check: (start, end, history) => {
            return Math.abs(history.totalRotation) >= 350;
        }
    },
    {
        id: 'c3',
        title: 'עצור בקיר',
        description: 'סע קדימה עד שהרובוט יזהה את הקיר באמצעות חיישן המגע, ואז עצור.',
        difficulty: 'Medium',
        check: (start, end, history) => {
            // Must have touched the wall AND be stopped at the end
            return history.touchedWall && !end.isMoving;
        }
    },
    {
        id: 'c4',
        title: 'צייד הצבעים',
        description: 'סע ברחבי הזירה עד שהרובוט יזהה את הצבע השחור (הטבעת השחורה או הקיר) באמצעות חיישן הצבע.',
        difficulty: 'Medium',
        check: (start, end, history) => {
            return history.detectedColors.includes('black');
        }
    }
];
