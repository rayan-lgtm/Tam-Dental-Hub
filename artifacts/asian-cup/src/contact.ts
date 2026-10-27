export const CLINIC_URL = "https://tamdental.sa";
export const WHATSAPP_NUMBER = "966920033363";

export const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
