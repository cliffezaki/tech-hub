import type { CSSProperties } from "react"
import { ARTICLE_FONTS } from "@/lib/editor-fonts"
export const TITLE_SECTIONS = {lead:"Leading Story",also:"Also Worth Reading",featured:"Featured Articles",reviews:"Featured Reviews",more:"More News / More Stories",trending:"Trending Now",newsPage:"News page",reviewsPage:"Reviews page",kenyaPage:"Tech Kenya",guidesPage:"How Stuff Works"} as const
export type TitleSection = keyof typeof TITLE_SECTIONS
export type TitleTypography = Partial<Record<TitleSection,{font:string;size:number}>>
export const TITLE_DEFAULT_FONTS:Partial<Record<TitleSection,string>>={more:"Lora"}
export const TITLE_DEFAULTS:Record<TitleSection,number>={lead:44,also:22,featured:24,reviews:20,more:23,trending:18,newsPage:26,reviewsPage:26,kenyaPage:26,guidesPage:26}
export function parseTitleTypography(raw:string):TitleTypography {
 try {const input=JSON.parse(raw),result:TitleTypography={};for(const key of Object.keys(TITLE_SECTIONS) as TitleSection[]){const v=input?.[key];if(v&&ARTICLE_FONTS.includes(v.font)&&Number.isFinite(v.size)&&v.size>=14&&v.size<=64)result[key]={font:v.font,size:v.size}}return result} catch{return {}}
}
export function titleVariables(raw:string):CSSProperties {
 const values=parseTitleTypography(raw);const style:Record<string,string>={};for(const key of Object.keys(TITLE_SECTIONS) as TitleSection[]){const v=values[key];style[`--title-${key}-font`]=v?.font||TITLE_DEFAULT_FONTS[key]||'var(--font-playfair), Georgia, serif';style[`--title-${key}-size`]=`${v?.size||TITLE_DEFAULTS[key]}px`}return style as CSSProperties
}
export function headlineStyle(font?:string,size?:string):CSSProperties {return {fontFamily:ARTICLE_FONTS.includes(font||"")?font:undefined,fontSize:size&&/^\d+px$/.test(size)&&parseInt(size)>=16&&parseInt(size)<=72?`clamp(${Math.min(24,parseInt(size))}px, 5vw, ${size})`:undefined}}
