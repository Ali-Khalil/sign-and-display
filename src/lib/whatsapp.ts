import { site } from '../config/site';

/** What the customizer sends with a design (filled in properly in Phase 2). */
export interface DesignSpec {
  mode: string;
  text: string;
  font?: string;
  colours?: string;
  size?: string;
  lighting?: string;
  estimate?: string;
  pageUrl: string;
}

const GREETING = 'Assalam o Alaikum,';

export function waLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** General enquiry from any page. */
export function waMessageGeneral(pageUrl: string): string {
  return `${GREETING} I need a signboard.\nType of sign: \nText/Name: \nSize (approx): \nCity: \n(From: ${pageUrl})`;
}

export function waMessageForType(typeName: string, pageUrl: string): string {
  return `${GREETING} I'm interested in ${typeName}.\nText/Name: \nSize (approx): \nCity: \n(From: ${pageUrl})`;
}

/** Enquiry for a service, with the blanks listed on its page. */
export function waMessageForService(serviceName: string, fields: string[], pageUrl: string): string {
  const blanks = [...fields, 'City'].map((field) => `${field}: `).join('\n');
  return `${GREETING} I'm interested in ${serviceName}.\n${blanks}\n(From: ${pageUrl})`;
}

export function waMessageForProject(projectTitle: string, pageUrl: string): string {
  return `${GREETING} I saw "${projectTitle}" in your portfolio and want something similar.\nText/Name: \nSize (approx): \nCity: \n(From: ${pageUrl})`;
}

export function waMessageForDesign(spec: DesignSpec, imageUrl?: string): string {
  const lines = [
    `${GREETING} I designed a sign on your website.`,
    `Type: ${spec.mode}`,
    `Text: ${spec.text}`,
    spec.font && `Font: ${spec.font}`,
    spec.colours && `Colours: ${spec.colours}`,
    spec.size && `Size: ${spec.size}`,
    spec.lighting && `Lighting: ${spec.lighting}`,
    spec.estimate && `Estimate shown: ${spec.estimate}`,
    imageUrl ? `Design image: ${imageUrl}` : 'I am attaching the downloaded design image.',
    'City: ',
    `(From: ${spec.pageUrl})`,
  ];
  return lines.filter(Boolean).join('\n');
}

/** tel: link built from the WhatsApp number, which is already international. */
export const telLink = `tel:+${site.whatsapp}`;
