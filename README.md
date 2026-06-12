Full House

Full House é uma plataforma web para jogar RPG de mesa online com amigos.

A ideia nasceu de um grupo de amigos que jogava junto e sentia falta de uma plataforma mais flexível, personalizada e agradável para campanhas de RPG. O objetivo inicial é criar uma ferramenta funcional para mesas próprias, mas com potencial para futuramente se tornar uma plataforma completa para diferentes grupos, sistemas e estilos de jogo.

Objetivo do projeto

Criar uma plataforma inspirada em ferramentas como Roll20, mas com foco em simplicidade, personalização e recursos pensados diretamente para jogadores e mestres.

A primeira versão jogável do Full House deve permitir:

criação de contas;
login com autenticação real;
criação e entrada em mesas;
gerenciamento de jogadores;
uso de mapas;
armazenamento de documentos da campanha;
fichas de personagens;
rolagem de dados;
suporte para mestre e jogadores.
Tecnologias utilizadas
Frontend
HTML
CSS
JavaScript
Estrutura inicial em /docs
Backend
Node.js
Express
Supabase
PostgreSQL
JWT para autenticação
bcrypt para criptografia de senhas
dotenv para variáveis de ambiente
CORS para comunicação entre front e back
Estrutura do projeto
Full-House/
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── docs/
│   ├── index.html
│   ├── login.html
│   ├── mapa.html
│   ├── combate.html
│   ├── docs.html
│   ├── ficha_t20.html
│   ├── script.js
│   └── style.css
│
├── .gitignore
└── README.md