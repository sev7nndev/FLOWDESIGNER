
import { BusinessInfo } from "../../types";

export interface LayoutItem {
    type: string;
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    align?: CanvasTextAlign;
    fontWeight?: string;
    strokeColor?: string;
    strokeWidth?: number;
    shadowColor?: string;
    shadowBlur?: number;
    gradientStart?: string;
    gradientEnd?: string;
    backgroundColor?: string;
    padding?: number;
    textShadow?: string;
    rotation?: number;
    icon?: string;
    effect?: string; // '3d-gold', '3d-chrome', 'neon'
}

export interface LayoutData {
    layout: LayoutItem[];
    analysis: string;
}

const extractServices = (details: string): string[] => {
    if (!details) return [];
    let clean = details.replace(/[\*\_\-\•]/g, '');
    let items = clean.split(/[\n,]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 40);
    return items.slice(0, 6);
};

// --- LAYOUT ENGINE V10: THE "PRO BLEND" & DYNAMIC SCALING ---
export const createDefaultLayout = (form: BusinessInfo): LayoutData => {
    const layout: LayoutItem[] = [];
    const services = extractServices(form.details || "");
    const hasServices = services.length > 0;

    // 1. MAIN TITLE (3D LOGO)
    // Dynamic Font Size based on name length
    const nameLen = form.companyName?.length || 10;
    const titleSize = nameLen > 15 ? 55 : 65; // Smaller font for long names

    if (form.companyName) {
        layout.push({
            type: "titulo",
            text: form.companyName.toUpperCase(),
            x: 50,
            y: 8,
            fontSize: titleSize,
            fontFamily: "Impact, sans-serif",
            color: "#FFFFFF",
            align: "center",
            fontWeight: "900",
            effect: '3d-chrome', // New effect
            strokeColor: "#000000",
            strokeWidth: 4
        });
    }

    // 2. SUBTITLE / SLOGAN
    // If we have detailed services, slogan is smaller or omitted
    if (form.details && !hasServices) {
         layout.push({
             type: "subtitle",
             text: `"${form.details.substring(0,60)}"`,
             x: 50,
             y: 55, // Center
             fontSize: 35,
             fontFamily: "Arial, sans-serif",
             color: "#FFD700",
             align: "center",
             fontWeight: "bold",
             shadowColor: "rgba(0,0,0,1)",
             shadowBlur: 10
        });
    }

    // 3. SERVICE LIST (Blended Overlay)
    if (hasServices) {
        let listY = 55; // Start lower middle

        // Header
        layout.push({ 
            type: "service-header", text: "NOSSOS SERVIÇOS", 
            x: 50, y: listY, fontSize: 24, fontFamily: "Arial", 
            color: "#FFD700", align: "center", fontWeight: "bold",
            strokeColor: "#000", strokeWidth: 2
        });
        listY += 5;

        services.forEach((service) => {
            layout.push({
                type: "service-item",
                text: service,
                x: 50,
                y: listY,
                fontSize: 28,
                fontFamily: "Arial",
                color: "#FFFFFF",
                align: "center",
                fontWeight: "bold",
                shadowColor: "rgba(0,0,0,1)",
                shadowBlur: 4,
                strokeColor: "#000",
                strokeWidth: 3
            });
            listY += 5;
        });
    }

    // 4. FOOTER (Contact Area)
    let footerY = 88;

    if (form.instagram) {
        layout.push({
            type: "social",
            text: `@${form.instagram.replace('@', '')}`,
            icon: 'instagram',
            x: 50,
            y: 82,
            fontSize: 24,
            fontFamily: "Arial",
            color: "#FFFFFF",
            align: "center",
            fontWeight: "bold",
            shadowColor: "rgba(0,0,0,1)",
            shadowBlur: 5
        });
    }

    if (form.phone) {
         layout.push({
            type: "contact",
            text: form.phone,
            icon: 'whatsapp',
            x: 50,
            y: footerY,
            fontSize: 38,
            fontFamily: "Arial",
            color: "#00FF00",
            align: "center",
            fontWeight: "bold",
            strokeColor: "#000000",
            strokeWidth: 5,
            shadowColor: "rgba(0,0,0,1)",
            shadowBlur: 5
        });
        footerY += 6;
    }

    if (form.addressStreet) {
         layout.push({
            type: "address",
            text: `${form.addressStreet}, ${form.addressNumber}`,
            icon: 'map',
            x: 50,
            y: 95, 
            fontSize: 16,
            fontFamily: "Arial",
            color: "#DDDDDD",
            align: "center",
            fontWeight: "bold",
            shadowColor: "rgba(0,0,0,1)",
            shadowBlur: 3
        });
    }

    return { layout, analysis: "Layout V10 Pro Blend" };
};

export const renderLayoutToCanvas = async (imageSrc: string, layoutData: LayoutData): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error("No ctx")); return; }

            // 1. SETUP CANVAS (1080x1920 Fixed)
            canvas.width = 1080;
            canvas.height = 1920;
            const w = canvas.width;
            const h = canvas.height;
            const scaleFactor = w / 1000;

            // 2. DRAW IMAGE (COVER MODE - Perfectly Integrated)
            const imgAspect = img.width / img.height;
            const canvasAspect = w / h;
            let dw, dh, dx, dy;

            if (imgAspect > canvasAspect) {
                // Image too wide
                dh = h; dw = h * imgAspect;
                dx = (w - dw) / 2; dy = 0;
            } else {
                // Image too tall
                dw = w; dh = w / imgAspect;
                dx = 0; dy = (h - dh) / 2;
            }
            ctx.drawImage(img, dx, dy, dw, dh);

            // 3. SEAMLESS GRADIENT OVERLAY (The "Blend")
            // Instead of a hard card, we use a smooth darkness acting as a base for text
            const grad = ctx.createLinearGradient(0, h * 0.4, 0, h);
            grad.addColorStop(0, "rgba(0,0,0,0)");      // Transparent top
            grad.addColorStop(0.5, "rgba(0,0,0,0.6)");  // Start darkening
            grad.addColorStop(0.8, "rgba(0,0,0,0.9)");  // Dark area for text
            grad.addColorStop(1, "rgba(0,0,0,1)");      // Solid black bottom
            ctx.fillStyle = grad;
            ctx.fillRect(0, h * 0.4, w, h * 0.6);

            // Top Gradient for Logo visibility
            const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.3);
            topGrad.addColorStop(0, "rgba(0,0,0,0.8)");
            topGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, w, h * 0.3);

            // 4. RENDER ELEMENTS with ADVANCED EFFECTS
            const drawChromeText = (text: string, x: number, y: number, font: string) => {
                ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline='middle';
                const d = 8 * scaleFactor;

                // 1. Deep Shadow (3D)
                ctx.fillStyle = "black";
                for(let i=d; i>0; i--) ctx.fillText(text, x+i, y+i);

                // 2. Stroke
                ctx.lineWidth = 10 * scaleFactor;
                ctx.strokeStyle = "rgba(0,0,0,0.8)";
                ctx.lineJoin = 'round';
                ctx.strokeText(text, x, y);

                // 3. Chrome Gradient Fill
                const g = ctx.createLinearGradient(x, y-50, x, y+50);
                g.addColorStop(0, "#FFFFEE"); // Highlight
                g.addColorStop(0.45, "#DDDDDD");
                g.addColorStop(0.5, "#888888"); // Horizon line
                g.addColorStop(0.55, "#AAAAAA");
                g.addColorStop(1, "#FFFFFF");
                ctx.fillStyle = g;
                ctx.fillText(text, x, y);
                
                // 4. Shine
                ctx.fillStyle = "rgba(255,255,255,0.7)";
                ctx.fillText(text, x-2, y-2);
            };

            layoutData.layout.forEach((item) => {
                const x = (item.x / 100) * w;
                const y = (item.y / 100) * h;
                const fontSize = (item.fontSize || 40) * scaleFactor;
                const font = `${item.fontWeight || 'bold'} ${fontSize}px ${item.fontFamily || 'Arial'}`;

                if (item.effect === '3d-chrome') {
                    drawChromeText(item.text, x, y, font);
                    return;
                }

                ctx.save();
                ctx.font = font;
                ctx.textAlign = item.align || 'center';
                ctx.textBaseline = 'middle';

                const textToDraw = item.icon 
                    ? (item.icon === 'whatsapp' ? '📱 ' : item.icon === 'instagram' ? '📷 ' : '📍 ') + item.text 
                    : item.text;

                if (item.shadowColor) {
                    ctx.shadowColor = item.shadowColor;
                    ctx.shadowBlur = (item.shadowBlur || 4) * scaleFactor;
                    ctx.shadowOffsetY = 3 * scaleFactor;
                }
                
                if (item.strokeColor) {
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = item.strokeColor;
                    ctx.lineWidth = (item.strokeWidth || 3) * scaleFactor * 2;
                    ctx.strokeText(textToDraw, x, y);
                }

                ctx.fillStyle = item.color || '#FFFFFF';
                ctx.fillText(textToDraw, x, y);
                ctx.restore();
            });

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error("BG Error"));
        img.src = imageSrc;
    });
};
