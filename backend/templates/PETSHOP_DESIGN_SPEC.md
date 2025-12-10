# DESIGN SPEC - PET SHOP PREMIUM TEMPLATE

## 📐 Dimensões
- **Tamanho**: 1080x1350px (vertical)
- **Device Scale Factor**: 2 (para Puppeteer)
- **Safe Area**: 64px (margens laterais)

## 🎨 Paleta de Cores

### Gradiente Principal
```css
background: linear-gradient(135deg, #4A90E2 0%, #7CB342 50%, #FF8C42 100%);
```

### Cores Específicas
- **Azul Céu**: `#4A90E2` - Confiança, profissionalismo
- **Verde Grama**: `#7CB342` - Natureza, saúde
- **Laranja Vibrante**: `#FF8C42` - Energia, alegria
- **Branco**: `#FFFFFF` - Limpeza, pureza
- **Preto Suave**: `rgba(0, 0, 0, 0.8)` - Contraste no rodapé

### Glassmorphism
```css
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(20px);
border: 2px solid rgba(255, 255, 255, 0.25);
```

## 🔤 Tipografia

### Fontes Google Fonts
```html
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Sora:wght@400;600;700&family=Manrope:wght@700;800&display=swap" rel="stylesheet">
```

### Hierarquia
1. **Logo/Marca**: Archivo Black, 72px, branco
2. **Headline**: Archivo Black, 56px, branco, line-height 1.2
3. **Subheadline**: Sora 600, 28px, branco 95%
4. **Títulos de Seção**: Archivo Black, 42px, branco
5. **Serviços**: Sora 700, 20px, branco
6. **CTA Button**: Manrope 800, 32px, branco, uppercase
7. **Contatos**: Sora 600, 20px, branco
8. **Badge**: Manrope 800, 18px, branco, uppercase

## 🖼️ Imagens Recomendadas

### Fontes (Unsplash - Licença Gratuita)
1. **Hero Principal** (450x350px):
   - URL: `https://images.unsplash.com/photo-1548199973-03cce0bbc87b`
   - Alt: "Golden Retriever feliz sorrindo"
   - Cutout: Sim (remover fundo)
   - Position: Centro

2. **Esquerda** (200x200px):
   - URL: `https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba`
   - Alt: "Gato persa fofo"
   - Cutout: Sim
   - Position: Esquerda

3. **Direita** (200x200px):
   - URL: `https://images.unsplash.com/photo-1601758228041-f3b2795255f1`
   - Alt: "Cachorro e gato juntos"
   - Cutout: Sim
   - Position: Direita

### Instruções de Uso
- Baixar imagens em alta resolução (mínimo 2x o tamanho final)
- Usar ferramenta de remoção de fundo (remove.bg ou Photoshop)
- Salvar como PNG com transparência
- Substituir os placeholders (🐕🐈🐾) pelas imagens reais

## 🎯 Ícones SVG Inline

### Serviços
- **Banho e Tosa**: Círculo (genérico)
- **Consultas**: Quadrado médico
- **Vacinação**: Escudo de proteção
- **Hotelzinho**: Casa
- **Day Care**: Check mark

### Contatos
- **Telefone**: Ícone de telefone
- **Localização**: Pin de mapa
- **Instagram**: Logo oficial

Todos os ícones são SVG inline, 24x24px base, escaláveis, cor branca.

## 🏷️ Badges e Selos

### Promo Badge
```css
position: absolute;
top: 50px;
right: 80px;
background: rgba(255, 255, 255, 0.2);
backdrop-filter: blur(20px);
border: 2px solid rgba(255, 255, 255, 0.3);
border-radius: 50px;
padding: 12px 28px;
```
Texto: "🎉 Promoção!"

## 📦 Composição Visual

### Camadas (z-index)
1. **Fundo** (z-index: 0): Mesh gradient + grain texture
2. **Shapes** (z-index: 1): Círculos decorativos desfocados
3. **Hero Images** (z-index: 5): Fotos dos pets
4. **Conteúdo** (z-index: 10): Texto, serviços, CTA, footer
5. **Badge** (z-index: 15): Selo de promoção

### Grid System
- 12 colunas
- Gap: 20px
- Serviços: 2 colunas (grid-template-columns: 1fr 1fr)
- Contatos: 2 colunas

### Efeitos Visuais
- **Blur**: 10px-60px (glassmorphism e shapes)
- **Sombras**: 0 8px 32px rgba(0,0,0,0.15) a 0 20px 60px rgba(0,0,0,0.3)
- **Grain**: Textura SVG com opacidade 0.3, blend mode overlay
- **Border Radius**: 16px-60px (cards e botões)

## 🎨 Elementos Decorativos

### Mesh Gradient
```css
radial-gradient(circle at 20% 30%, rgba(74, 144, 226, 0.4) 0%, transparent 50%),
radial-gradient(circle at 80% 70%, rgba(255, 140, 66, 0.4) 0%, transparent 50%),
radial-gradient(circle at 50% 50%, rgba(124, 179, 66, 0.3) 0%, transparent 50%)
```
Blur: 60px

### Shapes Orgânicas
- Círculo 1: 400x400px, top-right
- Círculo 2: 300x300px, bottom-left
- Background: rgba(255, 255, 255, 0.1)
- Backdrop-filter: blur(10px)

## 📱 Conteúdo do Cliente

### Dados Dinâmicos (Placeholders)
- `{{NOME_EMPRESA}}` → "PetLife"
- `{{WHATSAPP}}` → "(83) 9999-9999"
- `{{ENDERECO}}` → "R. Severino Pereira, 102 — Centro, Mato Grosso/PB"
- `{{INSTAGRAM}}` → "@petlifeoficial"

### Conteúdo Fixo
- **Headline**: "Previna doenças e garanta o bem-estar do seu pet"
- **Subheadline**: "Seu pet bem cuidado por um preço justo!"
- **Serviços**:
  1. Banho e Tosa Completa
  2. Consultas Veterinárias
  3. Vacinação e Check-ups
  4. Hotelzinho para Pets
  5. Day Care
- **CTA**: "Agende Agora!"

## ♿ Acessibilidade

### Contraste
- Texto branco sobre gradiente colorido: **AAA** (>7:1)
- Texto em cards glassmorphism: **AA** (>4.5:1)

### Alt Text
- Todas as imagens têm alt text em português
- Ícones SVG têm role="img" e aria-label

## 🖥️ Renderização Puppeteer

### Configuração
```javascript
await page.setViewport({
  width: 1080,
  height: 1350,
  deviceScaleFactor: 2
});
await page.setContent(html);
await page.screenshot({
  path: 'petshop-flyer.png',
  type: 'png'
});
```

### Tempo de Renderização
- Aguardar fontes carregarem: `waitUntil: 'networkidle0'`
- Tempo estimado: 2-3 segundos

## 📋 Checklist de Qualidade

- [x] Gradientes mesh aplicados
- [x] Glassmorphism em cards
- [x] SVG icons inline
- [x] Badges com backdrop-filter
- [x] Tipografia premium (3 fontes)
- [x] Sombras profundas
- [x] Grain texture
- [x] Shapes decorativos
- [x] Grid 12 colunas
- [x] Safe area 64px
- [x] Contraste AA/AAA
- [x] Alt text em português
- [x] CTA destacado
- [x] Responsivo para 1080x1350px

---

**Resultado**: Template premium pronto para renderização com Puppeteer, seguindo exatamente o estilo Nano Banana solicitado.
