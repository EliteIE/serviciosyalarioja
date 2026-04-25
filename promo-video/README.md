# Servicios 360 Promo Video

Video publicitario criado em Remotion para a marca **Servicios 360**, com dois formatos prontos:

- `Servicios360PromoVertical` (`1080x1920`) para reels, stories e ads sociais
- `Servicios360PromoLandscape` (`1920x1080`) para site, YouTube e telas horizontais

## O que o comercial destaca

- Profissionais verificados para o lar
- Busca rapida por categoria ou problema
- Comparacao de perfis, resenas e orcamentos
- Beneficios para clientes e para prestadores
- CTA final com o dominio correto: `servicios360.com.ar`

## Como usar

```powershell
cd "C:\Users\guime\OneDrive\Área de Trabalho\serviciosyalr-main\promo-video"
npm.cmd install
npm.cmd run dev
```

Para renderizar:

```powershell
npm.cmd run render:vertical
npm.cmd run render:landscape
```

Os arquivos sao gerados em `promo-video/renders/`.

## Observacoes

- O dominio foi padronizado como `servicios360.com.ar`, porque esse e o endereco canonico configurado no projeto principal.
- O video foi desenhado para funcionar mesmo sem screenshots da aplicacao, usando a identidade visual local e mockups animados mais estaveis para campanhas.
