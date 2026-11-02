import type { ProductMetrics } from './store.js';
export type Product={id:string;title:string;description:string;imageUrl:string;productUrl:string;price:number;currency:string;available:boolean;tags:string[];quality:number;brand?:string;brands?:string[];category?:string;age?:string};
export type Discovery=Product&{provenance:'creator_approved'|'ai_discovered';reason:string;aggregateIntent:ProductMetrics};
