import type { CSSProperties } from "react"
import { ARTICLE_FONTS } from "@/lib/editor-fonts"
export const TITLE_SECTIONS = {lead:"Leading Story",also:"Also Worth Reading",featured:"Featured Articles",reviews:"Featured Reviews",more:"More News / More Stories",trending:"Trending Now",newsPage:"News Page",reviewsPage:"Reviews Page",kenyaPage:"Tech Kenya",guidesPage:"How Stuff Works"} as const
export type TitleSection = keyof typeof TITLE_SECTIONS
export type SectionTitleStyle = {font:string;size:number;bold:boolean;italic:boolean;useArticleStyles:boolean}
export type TitleTypography = Partial<Record<TitleSection,SectionTitleStyle>>
export const TITLE_DEFAULT_FONTS:Partial<Record<TitleSection,string>>={more:"Lora"}
export const TITLE_DEFAULTS:Record<TitleSection,number>={lead:44,also:22,featured:24,reviews:20,more:23,trending:18,newsPage:26,reviewsPage:26,kenyaPage:26,guidesPage:26}
export function defaultTitleStyle(key:TitleSection):SectionTitleStyle {return {font:TITLE_DEFAULT_FONTS[key]||"Playfair Display",size:TITLE_DEFAULTS[key],bold:true,italic:false,useArticleStyles:true}}
export function parseTitleTypography(raw:string):TitleTypography {
 try {const input=JSON.parse(raw),result:TitleTypography={};for(const key of Object.keys(TITLE_SECTIONS) as TitleSection[]){const v=input?.[key];if(v&&ARTICLE_FONTS.includes(v.font)&&Number.isFinite(v.size)&&v.size>=14&&v.size<=72)result[key]={font:v.font,size:v.size,bold:typeof v.bold==="boolean"?v.bold:true,italic:v.italic===true,useArticleStyles:v.useArticleStyles!==false}}return result} catch{return {}}
}
export function titleVariables(raw:string):CSSProperties {
 const values=parseTitleTypography(raw);const style:Record<string,string>={};for(const key of Object.keys(TITLE_SECTIONS) as TitleSection[]){const v=values[key]||defaultTitleStyle(key);const fields={font:v.font,size:`${v.size}px`,weight:v.bold?"700":"400",style:v.italic?"italic":"normal"};for(const [name,value] of Object.entries(fields)){style[`--title-${key}-${name}`]=value;style[`--title-${key}-forced-${name}`]=v.useArticleStyles?"initial":value}}return style as CSSProperties
}
export type ArticleTitleStyle={titleFont?:string;titleSize?:string;titleBold?:boolean;titleItalic?:boolean}
export function headlineVariables(article:ArticleTitleStyle):CSSProperties {
 const style:Record<string,string>={};if(ARTICLE_FONTS.includes(article.titleFont||""))style['--article-title-font']=article.titleFont!;
 if(article.titleSize&&/^\d+px$/.test(article.titleSize)&&parseInt(article.titleSize)>=16&&parseInt(article.titleSize)<=72)style['--article-title-size']=article.titleSize;
 if(typeof article.titleBold==="boolean")style['--article-title-weight']=article.titleBold?"700":"400";
 if(typeof article.titleItalic==="boolean")style['--article-title-style']=article.titleItalic?"italic":"normal";
 return style as CSSProperties
}
export function headlineStyle(font?:string,size?:string,bold?:boolean,italic?:boolean):CSSProperties {return {fontFamily:ARTICLE_FONTS.includes(font||"")?font:undefined,fontSize:size&&/^\d+px$/.test(size)&&parseInt(size)>=16&&parseInt(size)<=72?`clamp(${Math.min(24,parseInt(size))}px, 5vw, ${size})`:undefined,fontWeight:typeof bold==="boolean"?(bold?700:400):undefined,fontStyle:typeof italic==="boolean"?(italic?"italic":"normal"):undefined}}
