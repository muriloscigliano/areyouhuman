# 🎬 Script de Vídeo Pitch - Sistema de Automação de Leads com IA

**Duração:** Até 4 minutos  
**Formato:** Explicação + Demonstração

---

## 📋 Estrutura do Vídeo

### [0:00 - 0:30] Introdução e Problema

**Fala:**
> "Olá! Meu nome é [Seu Nome] e hoje vou apresentar uma solução de automação de leads usando Inteligência Artificial Generativa.
> 
> O problema que resolvi é simples mas crítico: criar propostas comerciais profissionais leva de 2 a 4 horas por lead. Isso resulta em respostas tardias, perda de oportunidades e equipe sobrecarregada com trabalho manual.
> 
> A solução? Um sistema automatizado que transforma conversas em propostas profissionais em minutos, usando IA para qualificar leads e gerar conteúdo personalizado."

**Visual:**
- Tela inicial com título do projeto
- Gráfico mostrando tempo antes (2-4h) vs depois (5-10min)

---

### [0:30 - 1:15] Ferramentas Utilizadas

**Fala:**
> "Para construir essa solução, utilizei:
> 
> **n8n** como plataforma de automação - é open-source e permite criar workflows complexos visualmente.
> 
> **OpenAI GPT-4o e GPT-4o-mini** como motor de IA - para análise de qualidade, geração de propostas e criação de emails personalizados.
> 
> **Banana.dev com Gemini Nano** para gerar imagens de capa personalizadas para cada proposta.
> 
> **Nutrient.io** para converter HTML em PDF profissional.
> 
> E **Supabase** como banco de dados para armazenar leads e histórico."

**Visual:**
- Screenshot do n8n com workflow
- Logos das ferramentas utilizadas
- Diagrama mostrando integração entre serviços

---

### [1:15 - 2:30] Como Apliquei IA Generativa

**Fala:**
> "A IA Generativa está no coração da solução em três pontos principais:
> 
> **Primeiro, na qualificação inteligente:** O GPT-4o analisa cada lead considerando interesse, orçamento, urgência e clareza. Gera um score de 0 a 100 que determina automaticamente o melhor caminho - proposta completa ou nurturing.
> 
> **Segundo, na melhoria de conteúdo:** O GPT-4o recebe informações brutas do lead e transforma em proposta profissional - corrige erros, melhora linguagem, calcula preços e define escopo. Tudo isso através de prompts estruturados que incluem contexto do estúdio, estrutura de preços e formato de saída em JSON.
> 
> **Terceiro, na geração multimodal:** A IA cria não só textos, mas também prompts para imagens e emails personalizados. Cada proposta tem uma imagem de capa única gerada pelo Gemini Nano baseada no projeto específico.
> 
> Os prompts foram elaborados seguindo uma metodologia de 4 fases: definição de contexto, estruturação de informações, definição de tarefas e iteração com refinamento."

**Visual:**
- Screenshot do prompt no n8n
- Exemplo de input bruto vs output melhorado
- Fluxograma mostrando onde a IA atua
- Exemplo de imagem gerada

---

### [2:30 - 3:45] Demonstração da Solução

**Fala:**
> "Agora vou demonstrar como funciona na prática:
> 
> [DEMONSTRAÇÃO AO VIVO]
> 
> Primeiro, vou enviar um webhook com dados de um lead qualificado. O sistema recebe os dados, armazena no Supabase e dispara o workflow no n8n.
> 
> A IA analisa o lead e determina que tem score alto - 85 pontos. Isso aciona o caminho de proposta completa.
> 
> Veja aqui: o GPT-4o melhora a proposta, depois o Gemini Nano gera uma imagem de capa personalizada, o sistema cria o HTML, converte para PDF usando Nutrient.io, e finalmente gera um email personalizado.
> 
> Tudo isso acontece automaticamente em cerca de 2 minutos. O lead recebe uma proposta profissional completa com PDF, imagem personalizada e email contextualizado.
> 
> Para leads de baixa qualidade, o sistema envia automaticamente um email de nurturing pedindo mais informações, mantendo o relacionamento mesmo quando o lead não está pronto para comprar."

**Visual:**
- [GRAVAR TELA] Mostrando:
  1. Envio do webhook (Postman ou terminal)
  2. Execução no n8n (workflow rodando)
  3. Logs mostrando cada etapa
  4. Email recebido com PDF anexado
  5. PDF aberto mostrando proposta profissional

---

### [3:45 - 4:00] Conclusão e Links

**Fala:**
> "Em resumo, essa solução demonstra como IA Generativa pode transformar processos manuais em automações inteligentes e escaláveis.
> 
> Os principais benefícios são: redução de tempo de 2-4 horas para 5-10 minutos, personalização em escala, qualificação inteligente e nurturing automático.
> 
> O projeto está disponível publicamente. Links estão na descrição do vídeo.
> 
> Obrigado pela atenção!"

**Visual:**
- Slide final com:
  - Links do projeto
  - Resumo dos benefícios
  - Contato

---

## 🎥 Dicas de Gravação

### Preparação
1. **Teste o workflow antes** - Garanta que tudo funciona
2. **Prepare dados de teste** - Tenha leads de exemplo prontos
3. **Feche notificações** - Evite distrações durante gravação
4. **Teste áudio** - Verifique qualidade do microfone

### Durante a Gravação
1. **Fale pausadamente** - 4 minutos é tempo suficiente, não precisa correr
2. **Use exemplos visuais** - Mostre telas, não só fale
3. **Demonstre ao vivo** - Mostre o workflow executando em tempo real
4. **Se errar, continue** - Pode editar depois ou fazer retake da parte específica

### Edição
1. **Adicione legendas** - Facilita compreensão
2. **Destaque pontos importantes** - Use zoom ou círculos
3. **Mantenha ritmo** - Corte pausas longas
4. **Adicione música de fundo** - Volume baixo, apenas para ambiente

---

## 📝 Checklist Pré-Gravação

- [ ] Workflow n8n está funcionando
- [ ] Dados de teste preparados (`n8n-test-good-lead.json`)
- [ ] Screenshots dos fluxogramas prontos
- [ ] Exemplo de PDF gerado para mostrar
- [ ] Exemplo de email recebido para mostrar
- [ ] Links públicos verificados e funcionando
- [ ] Script revisado e praticado
- [ ] Ambiente de gravação preparado (tela limpa, sem notificações)

---

## 🔗 Links para Incluir na Descrição do Vídeo

**Workflow n8n:**
- Produção: `https://areyouhuman.up.railway.app/webhook/telos-ai-router`
- Teste: `https://areyouhuman.up.railway.app/webhook-test/telos-ai-router`

**Repositório:**
- GitHub: [Adicionar link do repositório]

**Documentação:**
- README completo: [Link do README_PT.md no GitHub]

---

## ⏱️ Timing Sugerido (Total: 4 minutos)

- **Introdução e Problema:** 30 segundos
- **Ferramentas:** 45 segundos
- **IA Generativa:** 1 minuto 15 segundos
- **Demonstração:** 1 minuto 15 segundos
- **Conclusão:** 15 segundos

**Total:** 4 minutos

---

## 💡 Versão Alternativa (Mais Rápida - 3 minutos)

Se precisar reduzir para 3 minutos:

- **Introdução:** 20s
- **Ferramentas:** 30s
- **IA Generativa:** 50s
- **Demonstração:** 1min 10s
- **Conclusão:** 10s

**Total:** 3 minutos

---

## 🎬 Roteiro Simplificado (Para Gravação Rápida)

### Parte 1: Problema (20s)
"O problema: criar propostas leva 2-4 horas. A solução: automação com IA que faz em minutos."

### Parte 2: Ferramentas (30s)
"Usei n8n para automação, OpenAI GPT-4o para IA, Banana.dev para imagens, Nutrient.io para PDFs e Supabase para dados."

### Parte 3: IA Generativa (50s)
"A IA qualifica leads com score, melhora propostas brutas em profissionais, gera imagens personalizadas e cria emails contextualizados. Tudo através de prompts estruturados."

### Parte 4: Demonstração (1min 20s)
"[MOSTRAR] Envio webhook → n8n executa → IA analisa → Gera proposta → Cria PDF → Envia email. Tudo automático em 2 minutos."

### Parte 5: Conclusão (10s)
"Resultado: de horas para minutos, personalização em escala, qualificação inteligente. Links na descrição!"

---

**Boa sorte com a gravação! 🎥**

---

## 🤖 Ferramentas de IA para Criar o Vídeo

### Opção 1: HeyGen (Recomendado para Pitch)
**Site:** https://heygen.com
**O que faz:** Cria vídeos com avatares de IA e voiceover
**Vantagens:**
- ✅ Templates prontos para pitch videos
- ✅ Avatares realistas que falam seu script
- ✅ Múltiplos idiomas (inclui português)
- ✅ Interface drag-and-drop fácil
- ✅ Não precisa aparecer na câmera

**Como usar:**
1. Crie conta gratuita
2. Escolha template "Startup Pitch Video"
3. Cole o script deste documento
4. Selecione avatar e voz
5. Adicione screenshots do workflow
6. Gere o vídeo

**Custo:** Plano gratuito disponível (vídeos limitados), planos pagos a partir de $24/mês

---

### Opção 2: Synthesia
**Site:** https://www.synthesia.io
**O que faz:** Vídeos com avatares de IA profissionais
**Vantagens:**
- ✅ Avatares muito realistas
- ✅ Suporte a português
- ✅ Templates profissionais
- ✅ Fácil de usar

**Custo:** A partir de $29/mês

---

### Opção 3: D-ID (Para Avatar Falando)
**Site:** https://www.d-id.com
**O que faz:** Anima fotos/avatares para falar seu script
**Vantagens:**
- ✅ Pode usar sua própria foto
- ✅ Animações naturais
- ✅ API disponível

**Custo:** Plano gratuito limitado, planos pagos disponíveis

---

### Opção 4: Loom (Gravação de Tela + Narração)
**Site:** https://www.loom.com
**O que faz:** Grava sua tela enquanto você explica
**Vantagens:**
- ✅ Gratuito
- ✅ Fácil de usar
- ✅ Mostra você + tela simultaneamente
- ✅ Edição simples

**Como usar:**
1. Instale extensão do Loom
2. Abra o workflow no n8n
3. Clique em "Record"
4. Fale o script enquanto mostra a tela
5. Compartilhe link público

**Custo:** Gratuito (até 25 vídeos), planos pagos para mais

---

### Opção 5: Mootion (Pitch Deck para Vídeo)
**Site:** https://mootion.com
**O que faz:** Converte slides em vídeo com IA
**Vantagens:**
- ✅ Transforma apresentação em vídeo
- ✅ Narração automática com IA
- ✅ Visuals gerados por IA

---

### Opção 6: BIGVU (Script + Narração IA)
**Site:** https://bigvu.tv
**O que faz:** Cria scripts e gera narração com IA
**Vantagens:**
- ✅ Gera script automaticamente
- ✅ Narração com voz de IA
- ✅ Edição de vídeo integrada

---

## 🎯 Recomendação para Seu Caso

### Para Demonstração Técnica (Mostrar Workflow):
**Use Loom** (Gratuito e Perfeito)
- Grava tela mostrando o n8n funcionando
- Você narra enquanto demonstra
- Mostra execução real do workflow
- Link público fácil de compartilhar

**Passos:**
1. Abra Loom e clique em "New Video"
2. Selecione "Screen + Camera" (ou só Screen)
3. Abra n8n workflow
4. Fale o script enquanto mostra:
   - Envio do webhook
   - Execução dos nós
   - Resultado final (email + PDF)
5. Pare gravação e compartilhe link

---

### Para Vídeo Mais Profissional (Sem Aparecer):
**Use HeyGen** (Melhor Custo-Benefício)
- Cria avatar profissional
- Narra seu script automaticamente
- Adiciona screenshots do workflow
- Resultado muito profissional

**Passos:**
1. Crie conta no HeyGen
2. Escolha template "Product Demo" ou "Startup Pitch"
3. Cole o script simplificado abaixo
4. Adicione screenshots:
   - Workflow n8n completo
   - Exemplo de PDF gerado
   - Exemplo de email recebido
5. Selecione avatar e voz em português
6. Gere vídeo

---

## 📝 Script Simplificado para HeyGen/Mootion

**Duração:** 3-4 minutos

```
[INTRODUÇÃO - 30s]
Olá! Sou [Nome] e vou apresentar uma solução de automação de leads usando IA Generativa.

O problema: criar propostas comerciais leva 2 a 4 horas por lead. Isso resulta em respostas tardias e perda de oportunidades.

A solução: um sistema automatizado que transforma conversas em propostas profissionais em minutos.

[FERRAMENTAS - 45s]
Usei n8n para automação de workflows, OpenAI GPT-4o para análise e geração de conteúdo, Banana.dev com Gemini Nano para imagens, Nutrient.io para conversão em PDF e Supabase para armazenamento de dados.

[IA GENERATIVA - 1min]
A IA Generativa está em três pontos principais:

Primeiro, qualificação inteligente. O GPT-4o analisa cada lead e gera um score que determina automaticamente o melhor caminho.

Segundo, melhoria de conteúdo. A IA transforma informações brutas em propostas profissionais através de prompts estruturados que incluem contexto, preços e formato JSON.

Terceiro, geração multimodal. A IA cria textos, prompts para imagens e emails personalizados. Cada proposta tem imagem única gerada pelo Gemini Nano.

[DEMONSTRAÇÃO - 1min 15s]
Agora vou mostrar como funciona. Quando um lead qualificado chega, o sistema automaticamente: melhora a proposta, gera imagem de capa, cria HTML, converte para PDF e envia email personalizado. Tudo em cerca de 2 minutos.

Para leads de baixa qualidade, o sistema envia automaticamente email de nurturing pedindo mais informações.

[CONCLUSÃO - 15s]
Resultado: redução de tempo de horas para minutos, personalização em escala e qualificação inteligente. Links na descrição!
```

---

## 🔗 Links para Incluir no Vídeo

**Workflow n8n:**
- Produção: https://areyouhuman.up.railway.app/webhook/telos-ai-router
- Teste: https://areyouhuman.up.railway.app/webhook-test/telos-ai-router

**Repositório GitHub:**
- [Adicionar link]

**Documentação:**
- README completo: [Link do README_PT.md]

---

## 💡 Dica Extra: Combinar Ferramentas

**Estratégia Híbrida:**
1. **Use Loom** para gravar demonstração técnica (mostrar workflow funcionando)
2. **Use HeyGen** para criar introdução/conclusão com avatar
3. **Edite juntos** usando ferramenta simples (Canva, CapCut, ou até mesmo Loom editor)

**Resultado:** Vídeo profissional com demonstração real + apresentação polida!

---

## 🎬 Checklist Final

- [ ] Escolhi a ferramenta (Loom recomendado para demo técnica)
- [ ] Script revisado e praticado
- [ ] Screenshots preparados (workflow, PDF, email)
- [ ] Dados de teste prontos para demonstração
- [ ] Workflow testado e funcionando
- [ ] Links verificados e funcionando
- [ ] Vídeo gravado/gerado
- [ ] Link público criado (YouTube, Loom, Google Drive)

