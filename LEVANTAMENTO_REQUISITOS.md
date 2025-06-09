# Levantamento de Requisitos - Sistema de Delivery de Comida

## 1. Visão Geral do Sistema

### 1.1 Descrição
Sistema de delivery de comida simplificado, similar ao iFood, que conecta clientes, estabelecimentos e entregadores para facilitar pedidos online de comida.

### 1.2 Objetivos
- Permitir que clientes façam pedidos de comida online
- Facilitar o gerenciamento de estabelecimentos e produtos
- Automatizar o processo de pagamento
- Fornecer comunicação entre clientes e estabelecimentos
- Gerar relatórios e análises de vendas

## 2. Stakeholders

### 2.1 Atores Principais
- **Cliente**: Usuário que faz pedidos
- **Administrador da Loja**: Gerencia estabelecimento e produtos
- **Sistema**: Operações automatizadas

### 2.2 Atores Secundários
- **Administrador do Sistema**: Gerencia plataforma global
- **Sistema de Pagamento**: Processa transações financeiras

## 3. Requisitos Funcionais

### 3.1 Gestão de Usuários (RF01-RF05)

**RF01 - Cadastro de Usuário**
- O sistema deve permitir o cadastro de novos usuários
- Dados obrigatórios: email, senha
- Validação de email único
- Definição automática de role (cliente por padrão)

**RF02 - Autenticação**
- O sistema deve autenticar usuários via email/senha
- Manter sessão ativa do usuário
- Logout seguro

**RF03 - Gestão de Perfil**
- O sistema deve permitir edição de dados do perfil
- Visualização de estatísticas pessoais (total gasto, pedidos)
- Histórico de atividades

**RF04 - Controle de Papéis**
- O sistema deve diferenciar entre Cliente e Administrador de Loja
- Permissões específicas por papel
- Transição de papel quando necessário

**RF05 - Estatísticas do Cliente**
- Rastrear total de pedidos realizados
- Calcular valor total gasto
- Registrar data do último pedido
- Calcular ticket médio

### 3.2 Gestão de Estabelecimentos (RF06-RF10)

**RF06 - Cadastro de Loja**
- Administradores podem cadastrar/editar dados da loja
- Dados obrigatórios: nome, categoria
- Upload de logo/imagem
- Controle de visibilidade da loja

**RF07 - Categorização de Lojas**
- Sistema de categorias de estabelecimentos
- Filtro por categoria
- Gerenciamento de categorias pelo admin

**RF08 - Gestão de Produtos**
- CRUD completo de produtos
- Categorização de produtos
- Controle de disponibilidade
- Upload de imagens
- Gestão de preços

**RF09 - Histórico de Preços**
- Rastrear alterações de preços
- Manter histórico temporal
- Relatórios de variação de preços

**RF10 - Estatísticas da Loja**
- Contador de pedidos
- Relatórios de vendas
- Análise de performance dos produtos

### 3.3 Sistema de Pedidos (RF11-RF20)

**RF11 - Carrinho de Compras**
- Adicionar/remover produtos do carrinho
- Calcular totais automaticamente
- Persistir carrinho entre sessões

**RF12 - Criação de Pedidos**
- Converter carrinho em pedido
- Calcular valor total
- Aplicar descontos quando aplicável
- Adicionar observações

**RF13 - Gestão de Status**
- Estados: pendente, confirmado, preparando, pronto, entregue, cancelado
- Transições controladas de status
- Notificações automáticas de mudança

**RF14 - Processamento de Pedidos**
- Administradores podem alterar status dos pedidos
- Visualizar detalhes completos do pedido
- Histórico de alterações

**RF15 - Sistema de Cupons**
- Criação e gestão de cupons de desconto
- Validação de cupons
- Controle de uso e limites
- Aplicação automática de descontos

**RF16 - Avaliações**
- Clientes podem avaliar pedidos entregues
- Notas de 1 a 5 estrelas
- Comentários opcionais
- Avaliações separadas para comida e entrega

**RF17 - Observações do Pedido**
- Campo livre para instruções especiais
- Visível para o estabelecimento
- Histórico de observações

**RF18 - Histórico de Pedidos**
- Visualização completa do histórico
- Filtros por data, status, loja
- Detalhes de cada pedido

**RF19 - Contagem de Vendas**
- Flag para controlar se pedido foi contabilizado
- Evitar dupla contagem em relatórios
- Estatísticas precisas

**RF20 - Itens do Pedido**
- Detalhamento de produtos, quantidades e preços
- Preços congelados no momento do pedido
- Cálculos automáticos de totais

### 3.4 Sistema de Pagamentos (RF21-RF25)

**RF21 - Integração PagBank**
- Processar pagamentos via PagBank
- Múltiplos métodos de pagamento
- Armazenar IDs de transação

**RF22 - Status de Pagamento**
- Rastrear status das transações
- Estados: pendente, aprovado, recusado, cancelado
- Notificações de mudança de status

**RF23 - Histórico de Transações**
- Logs completos de pagamentos
- Dados de resposta da operadora
- Rastreabilidade financeira

**RF24 - Métodos de Pagamento**
- Suporte a cartão de crédito/débito
- PIX
- Outros métodos conforme necessário

**RF25 - Reconciliação Financeira**
- Relatórios de vendas e pagamentos
- Controle de comissões
- Fechamentos periódicos

### 3.5 Sistema de Comunicação (RF26-RF30)

**RF26 - Chat por Pedido**
- Canal de comunicação específico por pedido
- Mensagens entre cliente e loja
- Histórico persistente

**RF27 - Notificações de Chat**
- Indicadores de mensagens não lidas
- Controle de último acesso
- Badges de notificação

**RF28 - Status do Chat**
- Estados: ativo, encerrado
- Encerramento automático após entrega
- Reativação se necessário

**RF29 - Histórico de Mensagens**
- Armazenamento permanente
- Busca no histórico
- Timestamps precisos

**RF30 - Notificações Push**
- Alertas de novos pedidos
- Mudanças de status
- Novas mensagens

### 3.6 Sistema de Notificações (RF31-RF35)

**RF31 - Notificações do Sistema**
- Alertas automáticos para usuários
- Diferentes tipos de notificação
- Controle de visualização

**RF32 - Status de Leitura**
- Marcar como lida/não lida
- Contadores de notificações
- Limpeza automática

**RF33 - Navegação Direta**
- Links diretos para seções específicas
- Deep linking para pedidos/chats
- Experiência fluida

**RF34 - Histórico de Notificações**
- Arquivo de notificações antigas
- Busca e filtros
- Retenção configurável

**RF35 - Preferências de Notificação**
- Controle pelo usuário
- Tipos de notificação ativas
- Canais de entrega

## 4. Requisitos Não Funcionais

### 4.1 Performance (RNF01-RNF05)

**RNF01 - Tempo de Resposta**
- Carregamento de páginas: < 3 segundos
- Operações CRUD: < 1 segundo
- Busca de produtos: < 2 segundos

**RNF02 - Escalabilidade**
- Suporte a 1000+ usuários simultâneos
- Crescimento horizontal do banco
- Cache eficiente

**RNF03 - Disponibilidade**
- Uptime mínimo de 99.5%
- Backup automático diário
- Recuperação rápida de falhas

**RNF04 - Otimização Mobile**
- Interface responsiva
- Performance otimizada para mobile
- Uso eficiente de dados

**RNF05 - Caching**
- Cache de consultas frequentes
- Invalidação inteligente
- Redução de carga no banco

### 4.2 Segurança (RNF06-RNF10)

**RNF06 - Autenticação Segura**
- Senhas criptografadas
- Tokens de sessão seguros
- Timeout automático

**RNF07 - Autorização**
- Controle de acesso baseado em papéis
- Validação de permissões
- Logs de acesso

**RNF08 - Proteção de Dados**
- Criptografia de dados sensíveis
- Conformidade LGPD
- Anonimização quando necessário

**RNF09 - Segurança de Pagamentos**
- Compliance PCI DSS
- Tokenização de cartões
- Comunicação criptografada

**RNF10 - Auditoria**
- Logs de todas as operações
- Rastreabilidade completa
- Monitoramento de segurança

### 4.3 Usabilidade (RNF11-RNF15)

**RNF11 - Interface Intuitiva**
- Design limpo e moderno
- Navegação clara
- Feedbacks visuais

**RNF12 - Acessibilidade**
- Conformidade WCAG 2.1
- Suporte a leitores de tela
- Navegação por teclado

**RNF13 - Experiência Mobile**
- App-like experience
- Gestos intuitivos
- Layouts otimizados

**RNF14 - Multilíngua**
- Suporte a português brasileiro
- Extensível para outras línguas
- Formatação regional

**RNF15 - Offline Capability**
- Cache local de dados críticos
- Sincronização automática
- Funcionalidades básicas offline

## 5. Regras de Negócio

### 5.1 Pedidos (RN01-RN10)

**RN01** - Pedidos só podem ser feitos em lojas visíveis e ativas
**RN02** - Produtos indisponíveis não podem ser adicionados ao carrinho  
**RN03** - Cupons têm limite de uso e validade
**RN04** - Descontos não podem exceder o valor do pedido
**RN05** - Status de pedidos seguem fluxo específico (pendente → confirmado → preparando → pronto → entregue)
**RN06** - Cancelamentos só são permitidos até status "preparando"
**RN07** - Avaliações só podem ser feitas após entrega
**RN08** - Chat é criado automaticamente com cada pedido
**RN09** - Preços são congelados no momento do pedido
**RN10** - Administrador da loja só pode gerenciar pedidos da própria loja

### 5.2 Usuários (RN11-RN15)

**RN11** - Email deve ser único no sistema
**RN12** - Cada loja pode ter apenas um administrador
**RN13** - Clientes não podem acessar funções administrativas
**RN14** - Estatísticas são calculadas apenas em pedidos entregues
**RN15** - Perfil não pode ser excluído se houver pedidos ativos

### 5.3 Financeiro (RN16-RN20)

**RN16** - Pagamento deve ser aprovado antes do processamento do pedido
**RN17** - Reembolsos só são permitidos para pedidos cancelados
**RN18** - Comissões são calculadas sobre o valor líquido
**RN19** - Relatórios financeiros são gerados apenas para dados próprios
**RN20** - Transações devem ser rastreáveis e auditáveis

## 6. Casos de Uso Prioritários

### 6.1 Alta Prioridade
1. Cadastro e autenticação de usuários
2. Navegação e busca de produtos
3. Criação e gestão de pedidos
4. Processamento de pagamentos
5. Gestão básica de lojas e produtos

### 6.2 Média Prioridade
1. Sistema de chat
2. Notificações push
3. Sistema de avaliações
4. Cupons de desconto
5. Relatórios básicos

### 6.3 Baixa Prioridade
1. Relatórios avançados
2. Analytics detalhados
3. Funcionalidades offline
4. Integrações externas
5. Ferramentas de marketing

## 7. Restrições e Limitações

### 7.1 Técnicas
- Utilização obrigatória do Supabase como backend
- Framework Next.js para frontend
- Integração PagBank para pagamentos
- Deploy na Vercel

### 7.2 Funcionais
- Sistema simplificado (não inclui delivery próprio)
- Foco em funcionalidades essenciais
- Interface única (não apps nativos)
- Operação regional limitada

### 7.3 Temporais
- Desenvolvimento em fases iterativas
- MVP em 3 meses
- Versão completa em 6 meses
- Manutenção evolutiva contínua

## 8. Critérios de Aceitação

### 8.1 Funcionais
- Todos os requisitos funcionais implementados
- Casos de uso principais funcionando
- Integração com sistemas externos ativa
- Dados persistidos corretamente

### 8.2 Qualidade
- Cobertura de testes > 80%
- Performance dentro dos SLAs
- Segurança validada por auditoria
- Usabilidade testada com usuários reais

### 8.3 Operacionais
- Sistema em produção estável
- Monitoramento ativo
- Backup e recovery funcionais
- Documentação completa

---

**Documento criado em:** $(date)
**Versão:** 1.0
**Status:** Aprovado para desenvolvimento 