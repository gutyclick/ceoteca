import type { Book } from '@/types';
const baseSections = (topic: string): Book['sections'] => [
 { type:'Introducción', title:'Por qué importa', content:`Contenido demo editorial: este análisis resume aprendizajes generales sobre ${topic} con enfoque práctico, sin reproducir texto del libro original.` },
 { type:'Contexto', title:'Marco mental', content:'Ubica la idea en una situación cotidiana y tradúcela a decisiones pequeñas, medibles y repetibles.' },
 { type:'Ideas principales', title:'Principios accionables', content:'Identifica patrones, evita promesas absolutas y convierte cada concepto en una práctica verificable.' },
 { type:'Actividades', title:'Pasa a la acción', content:'Elige una acción de dos minutos, define un recordatorio y revisa el resultado al final del día.' },
 { type:'Conclusión', title:'Cierre propio', content:'La utilidad está en aplicar una idea con criterio, no en sustituir la lectura completa de la obra.' },
];
const keyPoints = (topic: string): Book['keyPoints'] => [
 { title:'Reduce la fricción', explanation:`Haz que la primera acción relacionada con ${topic} sea muy fácil de iniciar.`, example:'Preparar el entorno la noche anterior.', action:'Define una acción de dos minutos para hoy.' },
 { title:'Mide una señal', explanation:'El progreso mejora cuando observas una métrica simple y honesta.', example:'Registrar una repetición diaria en vez de buscar perfección.', action:'Crea una casilla de seguimiento semanal.' },
 { title:'Adapta al contexto', explanation:'Una buena idea necesita ajustarse a tu tiempo, energía y responsabilidades.', example:'Aplicar una versión mínima durante días ocupados.', action:'Escribe tu versión realista del concepto.' },
];
const books: Book[] = [
 ['habitos-atomicos','Hábitos Atómicos','James Clear','Hábitos','Sistema práctico para diseñar hábitos pequeños y sostenibles.', 'orbit'],
 ['padre-rico-padre-pobre','Padre Rico, Padre Pobre','Robert Kiyosaki','Finanzas','Ideas introductorias para pensar activos, ingresos y educación financiera.', 'stairs'],
 ['la-startup-de-100','La Startup de $100','Chris Guillebeau','Emprendimiento','Enfoque lean para convertir habilidades en ofertas simples.', 'chart'],
 ['el-hombre-mas-rico-de-babilonia','El Hombre Más Rico de Babilonia','George S. Clason','Finanzas','Principios clásicos de ahorro, disciplina y administración del dinero.', 'diamond'],
 ['pensar-rapido-pensar-despacio','Pensar Rápido, Pensar Despacio','Daniel Kahneman','Psicología','Mapa accesible de sesgos, intuición y pensamiento deliberado.', 'mind'],
 ['el-poder-del-ahora','El Poder del Ahora','Eckhart Tolle','Psicología','Prácticas de presencia y atención para reducir ruido mental.', 'leaf'],
 ['como-ganar-amigos','Cómo Ganar Amigos e Influir Sobre las Personas','Dale Carnegie','Liderazgo','Principios de comunicación empática y relaciones profesionales.', 'people'],
 ['la-semana-laboral-de-4-horas','La Semana Laboral de 4 Horas','Tim Ferriss','Productividad','Ideas para cuestionar rutinas, delegar y diseñar sistemas personales.', 'clock'],
 ['mindset','Mindset','Carol S. Dweck','Psicología','Diferencia entre mentalidad fija y aprendizaje deliberado.', 'bolt'],
 ['el-inversor-inteligente','El Inversor Inteligente','Benjamin Graham','Finanzas','Conceptos prudentes sobre margen de seguridad y disciplina inversora.', 'shield'],
].map(([slug,title,author,category,description,symbol], index) => ({
 id:`book-${index+1}`, slug, title, author, category: category as Book['category'], description, readingTime: 10 + (index % 6), difficulty: index > 7 ? 'Avanzado' : index > 3 ? 'Intermedio' : 'Inicial', tags:[category as string,'demo','15 minutos'], hasAudio:index % 2 === 0, audioUrl:'', purchaseUrl:'https://example.com/comprar-libro-original', featured:index===0,
 coverConfig:{ gradient:['from-indigo-500 via-violet-600 to-pink-500','from-emerald-400 via-cyan-500 to-blue-600','from-amber-400 via-orange-500 to-rose-500','from-fuchsia-500 via-purple-600 to-indigo-600'][index%4], accent:['#8B5CF6','#22C55E','#F59E0B','#EC4899'][index%4], symbol: symbol as Book['coverConfig']['symbol'] },
 demoNotice:'Contenido demo editorial propio. No reproduce texto, portadas ni citas de la obra original.', keyPoints:keyPoints(title as string), sections:baseSections(title as string),
 conclusion:{ usefulFor:'Personas que quieren convertir ideas en acciones concretas.', limitations:'No reemplaza la lectura completa ni asesoría profesional.', whenToApply:'Cuando necesitas claridad rápida antes de profundizar.', nextStep:'Elige una acción mínima y ejecútala durante siete días.', related:['habitos-atomicos','mindset','la-semana-laboral-de-4-horas'].filter((s)=>s!==slug) },
}));
export const demoBooks = books;
export function getBookBySlug(slug: string){ return demoBooks.find((book)=>book.slug===slug); }
