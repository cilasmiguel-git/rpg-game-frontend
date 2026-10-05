# 🏰 Biblioteca de Assets & Casas RPG (Battlemap)

Esta pasta contém todos os assets visuais (imagens, sprites, casas, castelos, masmorras, props) carregados no seu Grid de RPG.

## 📂 Estrutura de Pastas:
- **`castles/`**: Castelos, Fortalezas, Muralhas, Torres e Portões levadiços.
- **`buildings/`**: Tavernas, Casas medievais, Ferraria, Mansões e Templos.
- **`dungeons/`**: Salas do trono, Criptas, Portais mágicos e Altares.
- **`nature/`**: Árvores gigantes, Penhascos, Bosques e Lagos.
- **`props/`**: Barracas de mercado, Fogueiras, Baús, Bigornas e Tochas.
- **`custom/`**: Pasta recomendada para você colocar suas próprias imagens (`.png`, `.svg`, `.jpg`, `.webp`).

## 🚀 Como adicionar novas imagens/casas diretamente por pasta:
1. Copie seus arquivos de imagem para dentro desta pasta (ex: `public/assets/battlemap/castles/meu_castelo.png` ou `custom/minha_casa.png`).
2. Adicione a entrada no arquivo `public/assets/battlemap/manifest.json` com as dimensões em blocos que você deseja (ex: `"widthTiles": 3, "heightTiles": 3`).
3. Ou, dentro do jogo, clique no botão **"📤 Importar Imagem/Casa"** e selecione o arquivo do seu computador!
