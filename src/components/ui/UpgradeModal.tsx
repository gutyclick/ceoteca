'use client';
import { X } from 'lucide-react';
export function UpgradeModal({open,onClose}:{open:boolean;onClose:()=>void}){if(!open)return null;return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="glass max-w-md rounded-3xl p-6"><button className="float-right" onClick={onClose} aria-label="Cerrar"><X/></button><h2 className="text-2xl font-black">Integración de pagos pendiente</h2><p className="mt-3 text-zinc-300">Este MVP no simula pagos exitosos. Aquí se conectará el proveedor elegido.</p></div></div>}
