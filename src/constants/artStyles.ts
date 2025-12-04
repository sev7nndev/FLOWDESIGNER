import { ArtStyle } from '@/types';

export const ART_STYLES: ArtStyle[] = [
  {
    id: 'moderno',
    name: 'Moderno & Clean',
    iconName: 'Feather',
    previewColor: 'from-cyan-400/20 to-blue-500/20',
    description: 'Design minimalista, tipografia elegante, muito espaço em branco, cores sóbrias com um ponto de destaque. Ideal para tecnologia, consultórios e marcas premium.'
  },
  {
    id: 'vintage',
    name: 'Vintage & Retrô',
    iconName: 'Camera',
    previewColor: 'from-amber-400/20 to-orange-500/20',
    description: 'Estética dos anos 70/80, cores quentes e desbotadas, texturas de papel antigo, fontes serifadas ou manuscritas. Perfeito para barbearias, hamburguerias e produtos artesanais.'
  },
  {
    id: 'neon',
    name: 'Neon & Vibrante',
    iconName: 'Zap',
    previewColor: 'from-pink-500/20 to-purple-500/20',
    description: 'Cores elétricas e brilhantes sobre fundos escuros, tipografia ousada, efeito de brilho (glow). Ótimo para baladas, eventos, açaí e negócios noturnos.'
  },
  {
    id: 'aquarela',
    name: 'Aquarela & Suave',
    iconName: 'Paintbrush',
    previewColor: 'from-green-400/20 to-teal-500/20',
    description: 'Traços que imitam pintura com aquarela, cores suaves e orgânicas, texturas delicadas. Indicado para spas, confeitarias, floriculturas e produtos naturais.'
  },
  {
    id: '3d',
    name: 'Render 3D',
    iconName: 'Cube',
    previewColor: 'from-indigo-500/20 to-violet-500/20',
    description: 'Elementos com aparência tridimensional, iluminação e sombras realistas, visual de computação gráfica. Excelente para produtos, games e tecnologia.'
  }
];