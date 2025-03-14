# Configuração do Cursor para o Projeto Better Food

Esta pasta contém arquivos de configuração para o Cursor IDE, permitindo uma melhor experiência de desenvolvimento com sugestões de código mais precisas e contextualizadas.

## Arquivos de Configuração

### `rules`
Contém as melhores práticas e padrões para o desenvolvimento com NextJS e Supabase. Este arquivo ajuda o Cursor a entender a estrutura e os padrões do projeto.

### `context.json`
Define quais arquivos devem ser indexados pelo Cursor para fornecer sugestões de código mais precisas. Inclui padrões para incluir e excluir arquivos específicos.

### `supabase.json`
Fornece informações sobre a estrutura do banco de dados Supabase, incluindo tabelas, colunas e funcionalidades utilizadas no projeto.

## Como Funciona

O Cursor utiliza esses arquivos para:

1. **Indexar o código**: Os arquivos especificados em `context.json` são indexados para fornecer sugestões de código mais precisas.
2. **Entender a estrutura**: As informações em `rules` e `supabase.json` ajudam o Cursor a entender a estrutura e os padrões do projeto.
3. **Melhorar sugestões**: Com base nessas informações, o Cursor pode fornecer sugestões de código mais precisas e contextualizadas.

## Atualizando a Configuração

Se você adicionar novas tabelas ao Supabase ou alterar a estrutura do projeto, atualize os arquivos de configuração correspondentes para manter as sugestões de código precisas.

## Benefícios

- Sugestões de código mais precisas
- Melhor entendimento da estrutura do projeto
- Maior produtividade no desenvolvimento
- Consistência no código seguindo as melhores práticas 