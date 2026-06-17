export type PlanId = 'free' | 'pro' | 'unlimited' | 'founder';
export type Feature = 'allBooks' | 'audio' | 'chat' | 'unlimitedChat' | 'earlyAccess' | 'advancedActivities';
export type Difficulty = 'Inicial' | 'Intermedio' | 'Avanzado';
export type BookCategory = 'Finanzas' | 'Hábitos' | 'Productividad' | 'Emprendimiento' | 'Psicología' | 'Liderazgo';
export interface CoverConfig { gradient: string; accent: string; symbol: 'orbit' | 'stairs' | 'bolt' | 'chart' | 'mind' | 'clock' | 'people' | 'leaf' | 'diamond' | 'shield'; }
export interface KeyPoint { title: string; explanation: string; example: string; action: string; }
export interface Book { id: string; slug: string; title: string; author: string; category: BookCategory; description: string; coverConfig: CoverConfig; readingTime: number; difficulty: Difficulty; tags: string[]; audioUrl?: string; purchaseUrl: string; hasAudio: boolean; featured?: boolean; demoNotice: string; keyPoints: KeyPoint[]; sections: { type: string; title: string; content: string }[]; conclusion: { usefulFor: string; limitations: string; whenToApply: string; nextStep: string; related: string[] }; }
export interface ChatTurn { role: 'user' | 'assistant'; content: string; }
