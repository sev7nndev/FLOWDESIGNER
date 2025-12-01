import { BusinessInfo, ArtStyle } from "./types";

export const PLACEHOLDER_EXAMPLES: BusinessInfo[] = [
  {
    companyName: "Calors Automóveis",
    phone: "(21) 99997-3749",
    addressStreet: "Rua Silenciosa",
    addressNumber: "278",
    addressNeighborhood: "São José",
    addressCity: "Rio de Janeiro",
    details: "Oficina mecânica completa. Faço lanternagem, pintura, rebaixamento, consertos de motor e troca de óleo. Faço tudo em carros nacionais e importados.",
    logo: "",
    styleId: 'cinematic'
  },
  {
    companyName: "Dra. Ana Estética",
    phone: "(11) 98888-5555",
    addressStreet: "Av. Paulista",
    addressNumber: "1000",
    addressNeighborhood: "Bela Vista",
    addressCity: "São Paulo",
    details: "Harmonização facial, botox, preenchimento labial e limpeza de pele. Clínica de alto padrão com equipamentos modernos.",
    logo: "",
    styleId: 'minimalist'
  },
  {
    companyName: "Pizzaria do Chef",
    phone: "(31) 97777-1234",
    addressStreet: "Rua do Ouro",
    addressNumber: "50",
    addressNeighborhood: "Serra",
    addressCity: "Belo Horizonte",
    details: "Pizza artesanal em forno a lenha. Promoção de terça-feira: compre uma gigante e ganhe um refrigerante. Entregamos em toda a região.",
    logo: "",
    styleId: 'vintage'
  },
  {
    companyName: "Escritório Silva Advocacia",
    phone: "(41) 3333-9999",
    addressStreet: "Rua das Flores",
    addressNumber: "12",
    addressNeighborhood: "Centro",
    addressCity: "Curitiba",
    details: "Especialista em causas trabalhistas e previdenciárias. Aposentadoria, auxílio doença e revisão de benefícios. Atendimento humanizado.",
    logo: "",
    styleId: '3d_render'
  }
];

export const ART_STYLES: ArtStyle[] = [
  { id: 'cinematic', name: 'Cinemático', iconName: 'Camera', previewColor: 'from-blue-500 to-cyan-500' },
  { id: 'minimalist', name: 'Minimalista', iconName: 'Feather', previewColor: 'from-gray-300 to-gray-500' },
  { id: 'neon', name: 'Neon / Cyberpunk', iconName: 'Zap', previewColor: 'from-fuchsia-500 to-cyan-500' },
  { id: 'vintage', name: 'Vintage / Retro', iconName: 'Radio', previewColor: 'from-amber-700 to-yellow-500' },
  { id: 'watercolor', name: 'Aquarela', iconName: 'Palette', previewColor: 'from-pink-400 to-purple-400' },
  { id: '3d_render', name: 'Render 3D', iconName: 'Cube', previewColor: 'from-green-500 to-teal-500' },
];