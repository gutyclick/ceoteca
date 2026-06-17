import type { Feature, PlanId } from '@/types';
export interface Plan { id: PlanId; name: string; monthlyPrice: number; annualPrice?: number; badge?: string; description: string; features: string[]; cta: string; highlighted?: boolean; founder?: boolean; chatLimit: number | 'fair-use' | 0; bookLimit: number | 'all'; }
export const plans: Plan[] = [
 { id:'free', name:'GRATIS', monthlyPrice:0, description:'Empieza con una muestra clara del método Ceoteca.', features:['3 libros','Sin audio','Sin chat','Vista previa de biblioteca'], cta:'Empieza gratis', chatLimit:0, bookLimit:3 },
 { id:'pro', name:'PRO', monthlyPrice:7.99, annualPrice:79, description:'Para aprender cada semana con audio e IA.', features:['Todos los libros','Audio','50 preguntas de chat al mes','Actividades interactivas','Historial'], cta:'Elegir Pro', highlighted:true, chatLimit:50, bookLimit:'all' },
 { id:'unlimited', name:'ILIMITADO', monthlyPrice:14.99, annualPrice:149, description:'Más profundidad, más preguntas y acceso anticipado.', features:['Todo Pro','Chat sin límite sujeto a uso razonable','Acceso anticipado','Funciones premium futuras'], cta:'Ir ilimitado', chatLimit:'fair-use', bookLimit:'all' },
 { id:'founder', name:'FUNDADOR', monthlyPrice:4.99, description:'Oferta temprana con precio protegido.', features:['$20 de entrada','Precio protegido','Limitado a 100 usuarios','Badge de fundador'], cta:'Ser fundador', badge:'Oferta activa', founder:true, chatLimit:50, bookLimit:'all' },
];
export const featureMatrix: Record<PlanId, Record<Feature, boolean>> = {
 free:{allBooks:false,audio:false,chat:false,unlimitedChat:false,earlyAccess:false,advancedActivities:false},
 pro:{allBooks:true,audio:true,chat:true,unlimitedChat:false,earlyAccess:false,advancedActivities:true},
 unlimited:{allBooks:true,audio:true,chat:true,unlimitedChat:true,earlyAccess:true,advancedActivities:true},
 founder:{allBooks:true,audio:true,chat:true,unlimitedChat:false,earlyAccess:false,advancedActivities:true},
};
export function getPlan(plan: PlanId){ return plans.find((item)=>item.id===plan) ?? plans[0]; }
