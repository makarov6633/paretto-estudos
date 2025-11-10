# PDF Storage Directory

Este diretório armazena os arquivos PDF originais dos itens da biblioteca.

## Como funciona

- Os PDFs são servidos através da rota `/api/item/pdf`
- O campo `pdfUrl` no banco de dados aponta para o caminho do arquivo (ex: `/media/pdf/nome-do-arquivo.pdf`)
- Se um PDF não existir, o leitor automaticamente mostrará uma mensagem de erro e permitirá visualizar o conteúdo em formato texto

## Adicionando PDFs

Para adicionar um novo PDF:

1. Coloque o arquivo neste diretório: `public/media/pdf/nome-do-arquivo.pdf`
2. Certifique-se de que o item no banco de dados tenha:
   - `pdfUrl`: `/media/pdf/nome-do-arquivo.pdf`
   - `hasPdf`: `true`

## Observações

- PDFs não são armazenados no Git por serem arquivos grandes
- O conteúdo de texto (seções) é gerado a partir dos PDFs usando o script `scripts/generate-sections-from-pdf.mjs`
- Mesmo sem o PDF, os usuários podem ler o conteúdo através das seções armazenadas no banco de dados
