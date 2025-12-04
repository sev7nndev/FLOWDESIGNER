# Flow Designer - Análise de Custos e Preços (BRL)

## 💰 Custo por Imagem (Imagen 3.0)

### API do Google
- **Custo**: $0.03 USD por imagem
- **Conversão**: R$ 0,15 por imagem (cotação: $1 = R$5,00)

### Margem de Lucro Sugerida

#### Plano FREE
- **Limite**: 5 imagens/mês
- **Custo**: R$ 0,75/mês
- **Preço**: GRÁTIS
- **Lucro**: -R$ 0,75 (investimento em aquisição)

#### Plano STARTER
- **Limite**: 100 imagens/mês
- **Custo**: R$ 15,00/mês
- **Preço Sugerido**: **R$ 49,90/mês**
- **Lucro**: R$ 34,90/mês (233% margem)

#### Plano PRO
- **Limite**: 1000 imagens/mês
- **Custo**: R$ 150,00/mês
- **Preço Sugerido**: **R$ 149,90/mês**
- **Lucro**: -R$ 0,10/mês (break-even)
- **Preço Alternativo**: **R$ 199,90/mês** → Lucro: R$ 49,90/mês (33% margem)

## 📊 Projeção de Receita

### Cenário Conservador (100 usuários)
- 70 Free: Custo R$ 52,50
- 20 Starter: Receita R$ 998,00 | Custo R$ 300,00
- 10 Pro: Receita R$ 1.499,00 | Custo R$ 1.500,00

**Total**:
- Receita: R$ 2.497,00
- Custo: R$ 1.852,50
- **Lucro: R$ 644,50/mês**

### Cenário Otimista (500 usuários)
- 350 Free: Custo R$ 262,50
- 100 Starter: Receita R$ 4.990,00 | Custo R$ 1.500,00
- 50 Pro: Receita R$ 7.495,00 | Custo R$ 7.500,00

**Total**:
- Receita: R$ 12.485,00
- Custo: R$ 9.262,50
- **Lucro: R$ 3.222,50/mês**

## 💡 Recomendações

### Opção 1: Preços Agressivos (Crescimento Rápido)
```
FREE: 5 imagens/mês - GRÁTIS
STARTER: 100 imagens/mês - R$ 49,90/mês
PRO: 1000 imagens/mês - R$ 149,90/mês
```
**Vantagem**: Atrai mais clientes, competitivo
**Desvantagem**: Margem baixa no Pro

### Opção 2: Preços Premium (Maior Margem)
```
FREE: 3 imagens/mês - GRÁTIS
STARTER: 50 imagens/mês - R$ 39,90/mês
PRO: 500 imagens/mês - R$ 99,90/mês
```
**Vantagem**: Margem de 200%+ em todos os planos
**Desvantagem**: Menos competitivo

### Opção 3: Preços Balanceados (RECOMENDADO)
```
FREE: 5 imagens/mês - GRÁTIS
STARTER: 100 imagens/mês - R$ 49,90/mês
PRO: 500 imagens/mês - R$ 99,90/mês
```
**Vantagem**: Equilíbrio entre competitividade e margem
**Lucro Starter**: R$ 34,90 (233% margem)
**Lucro Pro**: R$ 24,90 (33% margem)

## 🎯 Estratégia de Monetização

### Upsell Inteligente
1. **Free → Starter**: Após 3 imagens, mostrar preview de qualidade PRO
2. **Starter → Pro**: Oferecer desconto de 20% no primeiro mês
3. **Add-ons**: Pacotes extras (ex: +50 imagens por R$ 19,90)

### Redução de Custos
1. **Cache de Prompts**: Reutilizar prompts similares
2. **Batch Processing**: Gerar múltiplas imagens em lote
3. **Otimização**: Usar Imagen Fast quando possível (mais barato)

## 📈 Escalabilidade

### Com 1.000 usuários (Preços Balanceados)
- 700 Free: Custo R$ 525,00
- 200 Starter: Receita R$ 9.980,00 | Custo R$ 3.000,00
- 100 Pro: Receita R$ 9.990,00 | Custo R$ 7.500,00

**Total**:
- Receita: R$ 19.970,00
- Custo: R$ 11.025,00
- **Lucro: R$ 8.945,00/mês**

### Break-even
- **Usuários necessários**: ~50 pagantes
- **Tempo estimado**: 2-3 meses com marketing

## 🚀 Implementação

### Atualizar Preços no SQL
```sql
UPDATE public.plan_settings
SET price = 49.90, max_images_per_month = 100
WHERE id = 'starter';

UPDATE public.plan_settings
SET price = 99.90, max_images_per_month = 500
WHERE id = 'pro';
```

### Monitorar Custos
- Dashboard com custo real vs receita
- Alertas quando margem < 20%
- Análise mensal de uso por plano
